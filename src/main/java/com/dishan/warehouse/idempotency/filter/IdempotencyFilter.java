package com.dishan.warehouse.idempotency.filter;

import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import com.dishan.warehouse.idempotency.exception.IdempotencyConflictException;
import com.dishan.warehouse.idempotency.exception.IdempotencyInProgressException;
import com.dishan.warehouse.idempotency.service.IdempotencyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String IDEMPOTENCY_HEADER = "X-Idempotency-Key";
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH");

    private final IdempotencyService idempotencyService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String key = request.getHeader(IDEMPOTENCY_HEADER);

        // Only apply idempotency logic if header is present and method is mutating
        if (key == null || key.isBlank() || !MUTATING_METHODS.contains(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        key = key.trim();
        String httpMethod = request.getMethod();
        String requestUri = request.getRequestURI();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equalsIgnoreCase(auth.getName()))
                ? auth.getName()
                : "anonymous";

        CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);
        String requestHash = computeRequestHash(userId, httpMethod, requestUri, cachedRequest.getCachedBody());

        try {
            IdempotencyRecord replayRecord = idempotencyService.processOrReserve(userId, httpMethod, requestUri, key, requestHash);

            if (replayRecord != null) {
                // Replay saved response
                response.setStatus(replayRecord.getResponseStatus());
                response.setContentType("application/json");
                response.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
                if (replayRecord.getResponseBody() != null) {
                    response.getOutputStream().write(replayRecord.getResponseBody().getBytes(StandardCharsets.UTF_8));
                }
                response.flushBuffer();
                return;
            }

            // Newly reserved: proceed through downstream chain and capture output
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
            try {
                filterChain.doFilter(cachedRequest, responseWrapper);

                int status = responseWrapper.getStatus();
                if (status >= 200 && status < 300) {
                    String responseBody = new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
                    idempotencyService.complete(userId, httpMethod, requestUri, key, status, responseBody);
                } else {
                    idempotencyService.fail(userId, httpMethod, requestUri, key);
                }
            } catch (Exception ex) {
                idempotencyService.fail(userId, httpMethod, requestUri, key);
                throw ex;
            } finally {
                responseWrapper.copyBodyToResponse();
            }

        } catch (IdempotencyConflictException ex) {
            response.setStatus(HttpStatus.UNPROCESSABLE_ENTITY.value());
            response.setContentType("application/json");
            response.getOutputStream().write(
                    String.format("{\"status\":422,\"error\":\"Unprocessable Entity\",\"message\":\"%s\"}", ex.getMessage())
                            .getBytes(StandardCharsets.UTF_8)
            );
            response.flushBuffer();
        } catch (IdempotencyInProgressException ex) {
            response.setStatus(HttpStatus.CONFLICT.value());
            response.setContentType("application/json");
            response.getOutputStream().write(
                    String.format("{\"status\":409,\"error\":\"Conflict\",\"message\":\"%s\"}", ex.getMessage())
                            .getBytes(StandardCharsets.UTF_8)
            );
            response.flushBuffer();
        }
    }

    private String computeRequestHash(String userId, String method, String uri, byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String prefix = userId + ":" + method + ":" + uri + ":";
            digest.update(prefix.getBytes(StandardCharsets.UTF_8));
            digest.update(data != null ? data : new byte[0]);
            byte[] hash = digest.digest();
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) {
                    hex.append('0');
                }
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
