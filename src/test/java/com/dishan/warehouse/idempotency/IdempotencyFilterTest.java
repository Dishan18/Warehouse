package com.dishan.warehouse.idempotency;

import com.dishan.warehouse.idempotency.entity.IdempotencyRecord;
import com.dishan.warehouse.idempotency.entity.IdempotencyStatus;
import com.dishan.warehouse.idempotency.exception.IdempotencyConflictException;
import com.dishan.warehouse.idempotency.exception.IdempotencyInProgressException;
import com.dishan.warehouse.idempotency.filter.IdempotencyFilter;
import com.dishan.warehouse.idempotency.service.IdempotencyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdempotencyFilterTest {

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private IdempotencyFilter idempotencyFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    void doFilter_withoutIdempotencyHeader_passesThroughDirectly() throws ServletException, IOException {
        request.setMethod("POST");
        request.setRequestURI("/api/movements/outbound");

        idempotencyFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(idempotencyService);
    }

    @Test
    void doFilter_onGetMethod_bypassesIdempotencyEvenWithHeader() throws ServletException, IOException {
        request.setMethod("GET");
        request.setRequestURI("/api/movements");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, "test-key");

        idempotencyFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(idempotencyService);
    }

    @Test
    void doFilter_withCompletedRecord_replaysResponseDirectly() throws ServletException, IOException {
        request.setMethod("POST");
        request.setRequestURI("/api/movements/outbound");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, "test-key");
        request.setContent("{\"productId\":\"abc\",\"quantity\":5}".getBytes(StandardCharsets.UTF_8));

        IdempotencyRecord replay = IdempotencyRecord.builder()
                .idempotencyKey("test-key")
                .status(IdempotencyStatus.COMPLETED)
                .responseStatus(201)
                .responseBody("{\"id\":\"mv-1\",\"quantity\":5}")
                .build();

        when(idempotencyService.processOrReserve(eq("test-key"), anyString())).thenReturn(replay);

        idempotencyFilter.doFilter(request, response, filterChain);

        verify(filterChain, never()).doFilter(any(), any());
        assertEquals(201, response.getStatus());
        assertEquals("HIT-IDEMPOTENT", response.getHeader("X-Cache-Lookup"));
        assertEquals("{\"id\":\"mv-1\",\"quantity\":5}", response.getContentAsString());
    }

    @Test
    void doFilter_withNewKey_capturesResponseAndCallsComplete() throws ServletException, IOException {
        request.setMethod("POST");
        request.setRequestURI("/api/movements/outbound");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, "test-key-new");
        request.setContent("{\"productId\":\"abc\",\"quantity\":5}".getBytes(StandardCharsets.UTF_8));

        when(idempotencyService.processOrReserve(eq("test-key-new"), anyString())).thenReturn(null);

        doAnswer(invocation -> {
            jakarta.servlet.http.HttpServletResponse resp = invocation.getArgument(1);
            resp.setStatus(200);
            resp.getWriter().write("{\"success\":true}");
            return null;
        }).when(filterChain).doFilter(any(), any());

        idempotencyFilter.doFilter(request, response, filterChain);

        verify(idempotencyService).complete(eq("test-key-new"), eq(200), eq("{\"success\":true}"));
    }

    @Test
    void doFilter_whenConflictException_returns422() throws ServletException, IOException {
        request.setMethod("POST");
        request.setRequestURI("/api/movements/outbound");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, "test-key");
        request.setContent("{\"data\":1}".getBytes(StandardCharsets.UTF_8));

        when(idempotencyService.processOrReserve(eq("test-key"), anyString()))
                .thenThrow(new IdempotencyConflictException("Payload mismatch"));

        idempotencyFilter.doFilter(request, response, filterChain);

        assertEquals(422, response.getStatus());
        assertTrue(response.getContentAsString().contains("Payload mismatch"));
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void doFilter_whenInProgressException_returns409() throws ServletException, IOException {
        request.setMethod("POST");
        request.setRequestURI("/api/movements/outbound");
        request.addHeader(IdempotencyFilter.IDEMPOTENCY_HEADER, "test-key");
        request.setContent("{\"data\":1}".getBytes(StandardCharsets.UTF_8));

        when(idempotencyService.processOrReserve(eq("test-key"), anyString()))
                .thenThrow(new IdempotencyInProgressException("Currently in progress"));

        idempotencyFilter.doFilter(request, response, filterChain);

        assertEquals(409, response.getStatus());
        assertTrue(response.getContentAsString().contains("Currently in progress"));
        verify(filterChain, never()).doFilter(any(), any());
    }
}
