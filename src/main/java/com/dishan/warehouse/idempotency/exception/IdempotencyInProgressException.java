package com.dishan.warehouse.idempotency.exception;

public class IdempotencyInProgressException extends RuntimeException {
    public IdempotencyInProgressException(String message) {
        super(message);
    }
}
