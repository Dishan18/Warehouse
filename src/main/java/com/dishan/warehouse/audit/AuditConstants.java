package com.dishan.warehouse.audit;

public final class AuditConstants {

    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_INBOUND = "INBOUND";
    public static final String ACTION_OUTBOUND = "OUTBOUND";
    public static final String ACTION_ADJUSTMENT = "ADJUSTMENT";
    public static final String ACTION_LOGIN = "LOGIN";
    public static final String ACTION_REGISTER = "REGISTER";

    public static final String ENTITY_PRODUCT = "PRODUCT";
    public static final String ENTITY_CATEGORY = "CATEGORY";
    public static final String ENTITY_SUPPLIER = "SUPPLIER";
    public static final String ENTITY_STOCK_MOVEMENT = "STOCK_MOVEMENT";
    public static final String ENTITY_USER = "USER";
    public static final String ENTITY_SETTINGS = "SETTINGS";

    private AuditConstants() {
    }

}
