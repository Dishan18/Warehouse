package com.dishan.warehouse.websocket;

import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String WS_ENDPOINT = "/ws";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    private final UserRepository userRepository;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint(WS_ENDPOINT)
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {

        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {

                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

                    String authorization = accessor.getFirstNativeHeader("Authorization");

                    if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {

                        String token = authorization.substring(BEARER_PREFIX.length());
                        String email = jwtService.extractUsername(token);

                        User user = email == null
                                ? null
                                : userRepository.findByEmail(email)
                                        .filter(u -> jwtService.isTokenValid(token, u))
                                        .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
                                        .orElse(null);

                        if (user != null) {
                            accessor.setUser(new UsernamePasswordAuthenticationToken(
                                    user.getEmail(), null, List.of()));
                        }
                    }
                }

                return message;
            }
        });
    }

}
