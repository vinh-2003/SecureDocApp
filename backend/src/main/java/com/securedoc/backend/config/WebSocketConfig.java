package com.securedoc.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Frontend sẽ connect vào: http://localhost:8888/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Cho phép React connect (CORS)
                .withSockJS(); // Fallback nếu trình duyệt không hỗ trợ WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix cho các message từ server gửi xuống client
        registry.enableSimpleBroker("/topic");
        // Prefix cho các message từ client gửi lên server (nếu có)
        registry.setApplicationDestinationPrefixes("/app");
    }
}