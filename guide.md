# Complete Testing Guide, Architecture Flow & Interview Playbook

## 1. Quick Start & Manual Testing Guide

Follow these exact steps to boot the application and verify all features against the live **Supabase PostgreSQL** cloud database.

### Step 1: Launch Spring Boot Backend
Configure your database password, JWT secret, and administrator password in your environment, then start the server:

In PowerShell:
```powershell
$env:ADMIN_PASSWORD = "Admin@123"
$env:JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
$env:DB_PASSWORD = "your_supabase_database_password"
.\mvnw.cmd spring-boot:run
```

In Linux / macOS Bash:
```bash
export ADMIN_PASSWORD="Admin@123"
export JWT_SECRET="404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
export DB_PASSWORD="your_supabase_database_password"
./mvnw spring-boot:run
```

Wait for the console banner:
```
Started SmartWarehouseApplication in ~15 seconds
Tomcat started on port 8080 (http)
```

The database connection is active on **Supabase Session Pooler** (`aws-0-ap-northeast-1.pooler.supabase.com:5432`) with automatic schema synchronization.

---

### Step 2: Interactive Swagger UI
Open your browser to:
```
http://localhost:8080/swagger-ui.html
```
- Click **Authorize** (top right) after generating a token in Step 3.

---

### Step 3: Authenticate & Obtain Bearer Token
Run in a new terminal window using the configured `ADMIN_PASSWORD`:
```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@warehouse.com\",\"password\":\"Admin@123\"}"
```
**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "roles": ["ADMIN"]
}
```
> Save the `accessToken` into an environment variable or clipboard for subsequent requests:
> ```bash
> export TOKEN="<your-access-token>"
> ```
> *(Or in PowerShell: `$TOKEN = "<your-access-token>" `)*

---

### Step 4: Create Category & Supplier
Create a Category:
```bash
curl -s -X POST http://localhost:8080/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Electronics\",\"description\":\"Microcontrollers and sensors\",\"active\":true}"
```
*(Copy the returned category `id`)*

Create a Supplier:
```bash
curl -s -X POST http://localhost:8080/api/suppliers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Apex Logistics\",\"contactName\":\"John Doe\",\"email\":\"apex@supplies.com\",\"phone\":\"+1234567890\",\"address\":\"Warehouse District 4\",\"active\":true}"
```
*(Copy the returned supplier `id`)*

---

### Step 5: Create a Product
Create an inventory item with 10 units:
```bash
curl -s -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"MCU-ESP32-001\",\"name\":\"ESP32 Development Board\",\"description\":\"WiFi+BLE SoC\",\"price\":9.99,\"quantity\":10,\"minStock\":3,\"categoryId\":\"<CATEGORY_ID>\",\"supplierId\":\"<SUPPLIER_ID>\",\"active\":true}"
```
*(Copy the returned product `id`)*

---

### Step 6: Test Idempotency Engine (`X-Idempotency-Key`)

#### 6A. First Request (Fresh Key)
Send an outbound deduction request with a unique idempotency key:
```bash
curl -i -X POST http://localhost:8080/api/movements/outbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: demo-key-uuid-101" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":4,\"reason\":\"Client Order #1001\"}"
```
**Result**:
- HTTP `200 OK`
- `beforeQuantity: 10`, `afterQuantity: 6`
- Movement recorded in database; result cached in `idempotency_records`.

#### 6B. Retry the Same Request (Simulating Network Timeout / Client Retry)
Re-execute the exact same curl command with the same header `X-Idempotency-Key: demo-key-uuid-101`:
```bash
curl -i -X POST http://localhost:8080/api/movements/outbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: demo-key-uuid-101" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":4,\"reason\":\"Client Order #1001\"}"
```
**Result**:
- HTTP `200 OK`
- Notice response header: `X-Cache-Lookup: HIT-IDEMPOTENT`
- Response body returned from cache: `afterQuantity: 6`.
- **Zero double deduction occurred.** Product inventory remains safe at 6.

#### 6C. Key Conflict Detection (Reusing Key with Different Payload)
Send the same idempotency key with a different quantity:
```bash
curl -i -X POST http://localhost:8080/api/movements/outbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: demo-key-uuid-101" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":2,\"reason\":\"Different payload\"}"
```
**Result**:
- HTTP `422 Unprocessable Entity`
- Message: `"Idempotency key reused with different request payload"`

#### 6D. Scoped Key Isolation (Reusing Key Across Different Endpoints or Users)
Send an inbound addition request reusing the same key `demo-key-uuid-101`:
```bash
curl -i -X POST http://localhost:8080/api/movements/inbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: demo-key-uuid-101" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":3,\"reason\":\"Inbound shipment restocking\"}"
```
**Result**:
- HTTP `200 OK`
- `beforeQuantity: 6`, `afterQuantity: 9`
- Because the idempotency key is scoped by `(user_id, http_method, request_uri, key)`, this inbound request receives its own unique `IdempotencyRecord` and its own unique `StockMovement.idempotency_record_id`. It does not collide with or replay the outbound movement.

#### 6E. Crash Recovery & Lock Double-Check Protection
If an application worker crashes after the stock transaction commits but before the HTTP response cache completes:
- The `StockMovement` row is already committed with its unique `idempotency_record_id`.
- On client retry after the 2-minute in-flight lease expires, the request enters `MovementServiceImpl`.
- The service performs a check before acquiring the product lock, and re-checks under the pessimistic product lock (`findProductForUpdate`).
- It discovers the committed movement by `idempotency_record_id`, immediately replays the response, and never applies duplicate stock mutations.
- The database constraint `UNIQUE(idempotency_record_id)` guarantees at the storage engine level that duplicate stock movement rows cannot be inserted.

---

### Step 7: Test Pessimistic Lock & Overdraw Protection
Current quantity is 6. Try to deduct 10 units:
```bash
curl -i -X POST http://localhost:8080/api/movements/outbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":10,\"reason\":\"Overdraw attempt\"}"
```
**Result**:
- HTTP `400 Bad Request`
- Message: `"Insufficient stock: only 6 units available for MCU-ESP32-001"`
- Transaction rolled back. Product stock stays at 6.

---

### Step 8: Verify Transactional Audit Logs
Inspect the audit log created by our mutations:
```bash
curl -s -X GET http://localhost:8080/api/audit-logs \
  -H "Authorization: Bearer $TOKEN"
```
**Result**:
Lists audit records for `LOGIN`, `PRODUCT_CREATE`, and `OUTBOUND` movements, with timestamps, entity IDs, and user details.

---

### Step 9: Test Real-Time WebSocket Alerts
Connect any STOMP client (or use Chrome DevTools Console / Postman WebSocket client):
- **Endpoint**: `ws://localhost:8080/ws`
- **Subscribe Topic**: `/topic/stock-alerts`

Now deduct stock so the balance drops to or below the `minStock` threshold (3):
```bash
curl -s -X POST http://localhost:8080/api/movements/outbound \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"<PRODUCT_ID>\",\"quantity\":4,\"reason\":\"Drop to low stock\"}"
```
**Result**:
- Remaining quantity drops from 6 to 2 (below `minStock: 3`).
- Database commits.
- STOMP client receives alert frame:
```json
{
  "productId": "<PRODUCT_ID>",
  "productName": "ESP32 Development Board",
  "sku": "MCU-ESP32-001",
  "quantity": 2,
  "minStock": 3,
  "type": "LOW_STOCK"
}
```

---

## 2. Repository Folder Structure

```
d:\Warehouse
├── src/
│   ├── main/
│   │   ├── java/com/dishan/warehouse/
│   │   │   ├── SmartWarehouseApplication.java  # Main Spring Boot Entry point
│   │   │   ├── auth/                           # Security, JWT Service & User Controllers
│   │   │   ├── category/                       # Category Model, Controller, Service
│   │   │   ├── config/                         # AsyncConfig (ThreadPoolTaskExecutor), OpenAPI
│   │   │   ├── dashboard/                      # Real-time Metrics & Stock Value Projections
│   │   │   ├── entity/                         # Hibernate JPA Entity mappings
│   │   │   ├── exception/                      # GlobalExceptionHandler & Error DTOs
│   │   │   ├── idempotency/                    # Idempotency Filter, Service & Records
│   │   │   │   ├── entity/IdempotencyRecord.java
│   │   │   │   ├── entity/IdempotencyStatus.java
│   │   │   │   ├── exception/                  # 409 & 422 Conflict Exceptions
│   │   │   │   ├── filter/IdempotencyFilter.java
│   │   │   │   ├── filter/CachedBodyHttpServletRequest.java
│   │   │   │   ├── repository/IdempotencyRepository.java
│   │   │   │   └── service/IdempotencyService.java
│   │   │   ├── movement/                       # Concurrency-Safe Stock Movement Engine
│   │   │   │   ├── controller/MovementController.java
│   │   │   │   ├── event/StockLevelChangedEvent.java
│   │   │   │   ├── event/StockAlertEventListener.java # @TransactionalEventListener AFTER_COMMIT
│   │   │   │   ├── repository/StockMovementRepository.java
│   │   │   │   └── service/impl/MovementServiceImpl.java # Pessimistic Lock Implementation
│   │   │   ├── notification/                   # WebSocket Alert DTOs & Services
│   │   │   ├── product/                        # Product CRUD & Low-Stock queries
│   │   │   │   └── repository/ProductRepository.java # @Lock(PESSIMISTIC_WRITE) queries
│   │   │   ├── report/                         # CSV and Financial Valuation Reports
│   │   │   ├── settings/                       # Warehouse Global Configuration
│   │   │   ├── supplier/                       # Supplier Directory Management
│   │   │   ├── user/                           # User Directory & Role assignments
│   │   │   └── websocket/                      # STOMP Broker & Handshake configuration
│   │   └── resources/
│   │       ├── application.properties          # Base profile
│   │       ├── application-dev.properties      # Cloud Supabase PostgreSQL config (Session Pooler)
│   │       └── application-prod.properties
│   └── test/                                   # Unit & Concurrency test suites (71 tests)
├── pom.xml                                     # Maven dependencies (Spring Boot 3.5, Java 17)
├── README.md                                   # Project Overview
├── hld.md                                      # High-Level Architecture Design
├── lld.md                                      # Low-Level Code Architecture Design
└── guide.md                                    # This Testing & Interview Playbook
```

---

## 3. End-to-End Pipeline & Request Lifecycle

```
[Inbound HTTP Request]
         │
         ▼
[SecurityFilterChain]
         │
         ├──► [JwtAuthenticationFilter]: Validates Bearer token & populates SecurityContextHolder
         │
         ▼
[IdempotencyFilter]
         │
         ├──► Reads 'X-Idempotency-Key' (if absent -> pass-through)
         ├──► Resolves userId from SecurityContext, method, and URI
         ├──► Wraps request in CachedBodyHttpServletRequest (caches byte stream)
         ├──► Computes SHA-256 hash of (userId + method + uri + body)
         ├──► Calls IdempotencyService.processOrReserve (REQUIRES_NEW transaction):
         │       ├── Executes findForUpdate (SELECT ... FOR UPDATE row lock)
         │       ├── If COMPLETED & hash matches -> Replays cached HTTP response (Short-circuits!)
         │       ├── If COMPLETED & hash differs -> Returns 422 Unprocessable Entity
         │       ├── If IN_FLIGHT & not expired -> Returns 409 Conflict
         │       ├── If IN_FLIGHT expired -> Re-claims slot under lock and proceeds
         │       ├── If FAILED -> Resets to IN_FLIGHT under lock and proceeds
         │       └── If New -> Inserts IN_FLIGHT slot with uk_idempotency_scope constraint
         │
         ▼
[MovementController.outbound()]
         │
         ▼
[MovementServiceImpl.outbound()] (@Transactional)
         │
         ├──► ProductRepository.findByIdForUpdate(productId)
         │       └── Executes: SELECT ... FROM product WHERE id = ? FOR UPDATE
         │       └── Row is locked exclusively in PostgreSQL
         │
         ├──► Validates stock: if requested > available -> throws InsufficientStockException
         ├──► Decrements product.quantity
         ├──► Saves StockMovement record
         ├──► Saves AuditLog record
         ├──► EventBus.publishEvent(StockLevelChangedEvent) (Enqueued for AFTER_COMMIT)
         │
         ▼
[Transaction Commit Phase]
         │
         ├──► Hibernate flushes updates to PostgreSQL
         ├──► PostgreSQL commits changes & releases row lock
         │
         ▼
[Post-Commit Actions]
         │
         ├──► IdempotencyFilter captures 200 OK response body -> marks key COMPLETED
         │
         └──► ApplicationEventPublisher triggers StockAlertEventListener:
                 └── Handed off to dedicated 'alert-pool-*' thread
                 └── Checks low stock threshold in AppSettings
                 └── Dispatches STOMP WebSocket frame to '/topic/stock-alerts'
```

---

## 4. Top 10 High-Yield Interview Questions & Answers

### Q1: Why did you choose Pessimistic Locking over Optimistic Locking for inventory deduction?
**Answer**:
Optimistic locking (`@Version`) works well when collision probability is near zero. But in inventory and warehouse operations, multiple workers frequently fulfill orders for the same hot product simultaneously. Under optimistic locking, the second transaction fails at commit time with `OptimisticLockingFailureException`, requiring complex application-level retry loops that waste CPU cycles and database connections (retry storms). 

Pessimistic Write Locking (`SELECT ... FOR UPDATE`) queues concurrent transactions at the row level inside PostgreSQL. The first thread locks the product, decrements stock, and commits. The second thread unblocks, immediately sees the updated committed balance, and either proceeds or fails cleanly if stock is exhausted. This guarantees zero race conditions and deterministic execution under high concurrency.

---

### Q2: How does `SELECT ... FOR UPDATE` behave in PostgreSQL and Supabase poolers?
**Answer**:
In PostgreSQL, `SELECT ... FOR UPDATE` places an exclusive lock on the selected rows until the current transaction completes (via `COMMIT` or `ROLLBACK`). Other transactions attempting to read with `FOR UPDATE` or mutate those rows are blocked and queued. 

Crucially, when connecting via Supabase connection poolers, **Session mode (port 5432)** must be used for transactional locking rather than Transaction mode (port 6543). In Transaction mode (PgBouncer/Supavisor), connection affinity between transactions is severed, and prepared statements or session-scoped locks can behave unpredictably. Session mode provides dedicated connection affinity for the duration of the JDBC connection, allowing standard PostgreSQL row-level locks and Hibernate DDL updates to function reliably.

---

### Q3: How does your Idempotency implementation handle high-concurrency duplicate requests?
**Answer**:
Our idempotency engine uses a multi-layered defense:
1. **Scoped Uniqueness**: The `idempotency_records` table enforces a composite uniqueness constraint on `(user_id, http_method, request_uri, idempotency_key)`. Unrelated requests from different users or hitting different endpoints never collide even if they generate identical key strings.
2. **Pessimistic Lock Recovery**: When re-claiming an expired `IN_FLIGHT` record or retrying a `FAILED` record, `IdempotencyService` queries PostgreSQL using `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`). Concurrent retries are serialized in PostgreSQL: exactly one thread acquires the row lock and advances the status or expiration, while competing threads unblock, observe the renewed `IN_FLIGHT` status, and are blocked with HTTP `409 Conflict`.
3. **State Machine (`IN_FLIGHT`, `COMPLETED`, `FAILED`)**: When an initial request arrives, it reserves an `IN_FLIGHT` slot in an autonomous `REQUIRES_NEW` transaction. Concurrent initial inserts race against the unique constraint; the loser catches `DataIntegrityViolationException` and returns HTTP `409 Conflict`.
4. **Cryptographic Payload Validation**: Completed records store the SHA-256 digest of `(userId + method + uri + body)`. Identical requests replay the cached 2xx response. Different payloads reusing the same key are rejected with HTTP `422 Unprocessable Entity` to prevent payload mismatch and key hijacking.

---

### Q4: Why did you use `@TransactionalEventListener(phase = AFTER_COMMIT)` instead of pushing WebSocket messages directly inside the service?
**Answer**:
Calling `messagingTemplate.convertAndSend(...)` directly inside a `@Transactional` service method violates transactional consistency. If the inventory deduction succeeds in memory, but a subsequent step in the transaction fails (e.g. audit log database write fails, or commit connection drops), the database transaction rolls back. 

However, network socket writes to WebSocket clients cannot be rolled back-the alert would already be visible on browser dashboards! Using `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` ensures the listener is invoked only after the database returns an affirmative commit acknowledgment, eliminating ghost alerts.

---

### Q5: How is thread starvation prevented during WebSocket alert dispatches?
**Answer**:
We configured an isolated `ThreadPoolTaskExecutor` bean named `stockAlertExecutor` in [`AsyncConfig.java`](file:///d:/Warehouse/src/main/java/com/dishan/warehouse/config/AsyncConfig.java), and annotated the event listener with `@Async("stockAlertExecutor")`. 

If WebSocket dispatches were executed synchronously on the HTTP request thread, slow WebSocket network connections or socket buffering would delay HTTP response latency for API callers. By moving WebSocket framing onto a dedicated thread pool (core size 2, max size 10, queue capacity 50), the HTTP response returns immediately to the client upon database commit.

---

### Q6: Why do the Idempotency state transitions use `Propagation.REQUIRES_NEW`?
**Answer**:
If the idempotency status update ran in the same transaction as the stock deduction:
- If an `InsufficientStockException` or database error occurs during stock deduction, the entire transaction rolls back.
- That rollback would also discard the idempotency record update.
- The next client retry would have no record of the previous attempt or would remain permanently stuck in an invalid state.

By executing `IdempotencyService` methods with `@Transactional(propagation = Propagation.REQUIRES_NEW)`, the idempotency slot reservation and status transitions run in an autonomous database transaction that commits independently of the business transaction's success or failure.

---

### Q7: How does your servlet filter inspect request bodies without breaking Spring MVC `@RequestBody`?
**Answer**:
Under the Java Servlet API, `request.getInputStream()` is a forward-only stream that can only be consumed once. If a filter reads it to compute a SHA-256 hash, downstream Spring MVC controllers throw `HttpMessageNotReadableException`.

We implemented [`CachedBodyHttpServletRequest`](file:///d:/Warehouse/src/main/java/com/dishan/warehouse/idempotency/filter/CachedBodyHttpServletRequest.java) extending `HttpServletRequestWrapper`. In the constructor, it reads the entire stream into a `byte[]` memory buffer. It overrides `getInputStream()` and `getReader()` to return fresh `ByteArrayInputStream` instances every time they are called. This allows the filter to compute the SHA-256 digest while allowing Spring MVC to deserialize the JSON body downstream.

---

### Q8: What is the difference between this event-listener approach and the Transactional Outbox pattern?
**Answer**:
- **Our Approach (`@TransactionalEventListener(AFTER_COMMIT)` + `@Async`)**: Best suited for ephemeral, non-critical notifications like live UI dashboard alerts. It guarantees zero ghost messages on rollback. However, if the JVM crashes in the exact millisecond between the DB commit and WebSocket dispatch, the in-memory event is lost.
- **Transactional Outbox Pattern**: Required when downstream events are business-critical (e.g., payment webhooks or shipping order queues). In that pattern, an outbox table record is inserted within the exact same database transaction as the business mutation. A separate CDC engine (like Debezium) or polling worker reads from the outbox table and delivers messages with at-least-once delivery guarantees.

---

### Q9: How are audit logs kept transactionally consistent with inventory changes?
**Answer**:
In [`MovementServiceImpl.java`](file:///d:/Warehouse/src/main/java/com/dishan/warehouse/movement/service/impl/MovementServiceImpl.java), `auditLogService.record(...)` is called synchronously within the method boundary. 

Because the method is annotated with `@Transactional`, the SQL `INSERT INTO audit_logs` statement executes across the same database connection and within the same PostgreSQL transaction block as the `UPDATE product` and `INSERT INTO stock_movement` statements. If either the stock update or the audit log write fails, both statements roll back atomically. There is zero possibility of an untracked inventory change.

---

### Q10: How would you scale this architecture to 100,000 requests per second across multiple server nodes?
**Answer**:
1. **Distributed Caching & Idempotency**: Move `idempotency_records` checks from PostgreSQL to an in-memory Redis cluster using Redis atomic `SET key value NX PX 86400000` (Set if Not Exists with TTL). This offloads idempotency lookups from the relational database into sub-millisecond RAM operations.
2. **Horizontal Stock Partitioning**: Shard the `product` table by category or product ID hash across multiple database instances to distribute row-locking contention across different database nodes.
3. **Distributed Message Broker**: Replace Spring's in-memory `SimpleBrokerMessageHandler` with a dedicated Redis Pub/Sub, RabbitMQ, or Kafka cluster relay so WebSocket subscribers connected across multiple application server instances receive broadcast stock alerts uniformly.
