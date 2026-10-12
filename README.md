# Smart Warehouse: Concurrency-Safe Inventory and Logistics Engine

[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Smart Warehouse is an enterprise-grade warehouse inventory and stock management backend built with Java 17 and Spring Boot 3.5, backed by a cloud-hosted Supabase PostgreSQL database. It replaces error-prone spreadsheet tracking with a concurrency-safe, audit-backed transaction engine featuring real-time STOMP/WebSocket alerts and idempotency guarantees.

---

## Key Engineering Highlights

- **Pessimistic Locking Concurrency Control**: Prevents race conditions, lost updates, and negative inventory across all mutating stock operations (`inbound`, `outbound`, `adjust`) via row-level `SELECT ... FOR UPDATE` queries in PostgreSQL.
- **Scoped Idempotency Engine with Pessimistic Recovery**: Intercepts mutating endpoints with `X-Idempotency-Key` headers, scoping keys by user, HTTP method, and endpoint under composite unique database constraints. Employs row-level pessimistic locks (`SELECT ... FOR UPDATE`) during recovery of expired in-flight or failed records to eliminate recovery race conditions.
- **Transaction-Bound WebSocket Alerts**: Emits real-time STOMP threshold alerts using Spring's `@TransactionalEventListener(phase = AFTER_COMMIT)` on a dedicated async thread pool, preventing false alerts on transaction rollback.
- **Stateless RBAC Security**: JWT-based authentication enforcing granular permissions across ADMIN, MANAGER, and EMPLOYEE roles.
- **Cloud Database (Zero Local Docker Dependency)**: Fully configured for cloud Supabase PostgreSQL using SSL session pooling, with automatic schema synchronization and startup seed data.
- **Transactional Audit Trail**: Synchronously records immutable audit log entries within the same database transaction as business state mutations.

---

## Tech Stack

### Backend
- **Core**: Java 17 (LTS), Spring Boot 3.5.4
- **Security**: Spring Security 6, Stateless JWT (HMAC-SHA256), BCrypt
- **Persistence**: Spring Data JPA, Hibernate ORM 6, HikariCP
- **Database**: Cloud PostgreSQL 17 (Supabase Session Pooler with SSL)
- **Real-Time Messaging**: Spring WebSocket, STOMP message broker
- **Async Execution**: Spring Task Execution (`ThreadPoolTaskExecutor`)
- **API Documentation**: SpringDoc OpenAPI 3 (Swagger UI)
- **Object Mapping**: MapStruct, Lombok
- **Testing**: JUnit 5, Mockito, Spring Boot Test, JaCoCo

### Frontend (Optional UI Client)
- **Framework**: React 19, Vite 6, TypeScript 5.7
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query) v5
- **Real-Time Client**: STOMP client (`@stomp/stompjs`) with SockJS fallback
- **Analytics & Charts**: Recharts, jsPDF

---

## Architecture Documentation

For complete technical specifications, see:
- [High-Level Design (hld.md)](hld.md): System architecture, topology, component interactions, and data flow diagrams.
- [Low-Level Design (lld.md)](lld.md): Concurrency model, database ER diagram, idempotency state machine, and transaction event lifecycles.
- [Testing & Interview Guide (guide.md)](guide.md): Step-by-step manual testing script (cURL/Swagger), request pipeline walkthrough, and top 10 interview questions with answers.

---

## Getting Started

### Prerequisites
- Java Development Kit (JDK) 17 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Dishan18/Warehouse.git
cd Warehouse
```

### 2. Configure Environment Variables
Set the database password via an environment variable prior to starting the application:

On Linux / macOS:
```bash
export DB_PASSWORD="your_supabase_database_password"
```

On Windows (PowerShell):
```powershell
$env:DB_PASSWORD = "your_supabase_database_password"
```

See `.env.example` for all configurable environment variables (`DB_URL`, `DB_USERNAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).

### 3. Run the Backend
On Linux / macOS:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

On Windows (PowerShell):
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

Once started:
- API Server runs at: `http://localhost:8080`
- Swagger UI available at: `http://localhost:8080/swagger-ui.html`
- WebSocket STOMP endpoint: `ws://localhost:8080/ws`

Default administrator account seeded on startup:
- **Email**: `admin@warehouse.com`
- **Password**: `Admin@123`

### 4. Run the Frontend (Optional)
To run the React web interface:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173` and proxies API requests to `http://localhost:8080`.

---

## API Overview

| Module | Route | Access | Method / Notes |
|---|---|---|---|
| Auth | `/api/auth/login` | Public | POST: Generates JWT token with role claims |
| Auth | `/api/auth/register` | Public | POST: Register new user account |
| Products | `/api/products/**` | Authenticated | GET, POST, PUT, DELETE: CRUD and stock lookups |
| Categories | `/api/categories/**` | Authenticated | GET, POST, PUT, DELETE: Product category management |
| Movements | `/api/movements/inbound` | Authenticated | POST: Inbound stock addition |
| Movements | `/api/movements/outbound` | Authenticated | POST: Concurrency-safe stock deduction (Pessimistic Lock) |
| Movements | `/api/movements/adjust` | Authenticated | POST: Inventory recount adjustment |
| Suppliers | `/api/suppliers/**` | Authenticated | GET, POST, PUT, DELETE: Supplier management |
| Dashboard | `/api/dashboard/**` | Authenticated | GET: Inventory value, low stock lists, category counts |
| Reports | `/api/reports/**` | Authenticated | GET: Movement statistics and CSV exports |
| Notifications | `/api/notifications/**` | Authenticated | GET, PATCH: In-app notifications and unread counters |
| Audit Logs | `/api/audit-logs/**` | ADMIN | GET: Complete transactional mutation ledger |
| Users | `/api/users/**` | ADMIN | GET, POST, PUT, DELETE: Staff directory and roles |
| Settings | `/api/settings/**` | ADMIN | GET, PUT: Global thresholds and alert toggles |

---

## Project Structure

```
com.dishan.warehouse
|-- auth          # JWT security, authentication service, user access
|-- category      # Product categories
|-- config        # ThreadPoolTaskExecutor (AsyncConfig), OpenAPI configuration
|-- dashboard     # Metrics, aggregation, inventory value calculations
|-- entity        # Hibernate JPA entity definitions
|-- exception     # Centralized GlobalExceptionHandler and exception types
|-- idempotency   # X-Idempotency-Key filter, SHA-256 payload hashing, response cache
|-- movement      # Stock movements, pessimistic locking, AFTER_COMMIT event dispatch
|-- notification  # Notification models and WebSocket STOMP messaging
|-- product       # Product catalog and pessimistic write lock repository queries
|-- report        # CSV reporting and analytics aggregation
|-- settings      # Global warehouse parameters and thresholds
|-- supplier      # Supplier directory
|-- user          # Administrative user management
`-- websocket     # STOMP broker registration and handshake configuration
```

---

## Testing

Run the test suite:
```bash
./mvnw test
```

The test suite covers:
- Concurrency and pessimistic write locking assertions (`MovementServiceImplTest`)
- Idempotency key state machine, response replay, and conflict handling (`IdempotencyServiceTest`, `IdempotencyFilterTest`)
- Business services unit tests across products, categories, suppliers, notifications, and reports
- Integration test suite configured with Testcontainers (gracefully bypassed in non-Docker development environments)

---

## License

This project is licensed under the MIT License.
