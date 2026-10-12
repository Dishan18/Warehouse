package com.dishan.warehouse.idempotency;

import java.util.UUID;

public final class IdempotencyContext {

    private static final ThreadLocal<Scope> CURRENT_SCOPE = new ThreadLocal<>();

    public record Scope(UUID recordId, String userId, String httpMethod, String requestUri, String key) {}

    private IdempotencyContext() {}

    public static void set(UUID recordId, String userId, String httpMethod, String requestUri, String key) {
        CURRENT_SCOPE.set(new Scope(recordId, userId, httpMethod, requestUri, key));
    }

    public static void set(String userId, String httpMethod, String requestUri, String key) {
        CURRENT_SCOPE.set(new Scope(null, userId, httpMethod, requestUri, key));
    }

    public static Scope get() {
        return CURRENT_SCOPE.get();
    }

    public static void clear() {
        CURRENT_SCOPE.remove();
    }
}
