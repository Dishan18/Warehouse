package com.dishan.warehouse.report.util;

public final class CsvUtil {

    private CsvUtil() {
    }

    public static String escape(Object value) {

        if (value == null) {
            return "";
        }

        String raw = value.toString();
        boolean needsQuotes = raw.indexOf(',') >= 0
                || raw.indexOf('"') >= 0
                || raw.indexOf('\n') >= 0
                || raw.indexOf('\r') >= 0;

        if (!needsQuotes) {
            return raw;
        }

        return '"' + raw.replace("\"", "\"\"") + '"';
    }

    public static String join(String[] fields) {

        StringBuilder builder = new StringBuilder();

        for (int i = 0; i < fields.length; i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(escape(fields[i]));
        }

        return builder.append('\n').toString();
    }

}
