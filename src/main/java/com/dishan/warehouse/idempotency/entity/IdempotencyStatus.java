package com.dishan.warehouse.idempotency.entity;

public enum IdempotencyStatus {
    IN_FLIGHT,
    COMPLETED,
    FAILED
}
