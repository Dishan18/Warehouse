package com.dishan.warehouse.idempotency;

public final class IdempotencyContext {

    private static final ThreadLocal<Scope> CURRENT_SCOPE = new ThreadLocal<>();

    public record Scope(String userId, String httpMethod, String requestUri, String key) {}

    private IdempotencyContext() {}

    public static void set(String userId, String httpMethod, String requestUri, String key) {
        CURRENT_SCOPE.set(new Scope(userId, httpMethod, requestUri, key));
    }

    public static Scope get() {
        return CURRENT_SCOPE.get();
    }

    public static void clear() {
        CURRENT_SCOPE.remove();
    }
}
