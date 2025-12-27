package com.securedoc.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@Document(collection = "verification_tokens")
public class VerificationToken {
    @Id
    private String id;

    @Indexed
    private String token;

    @DBRef
    private User user;

    private LocalDateTime expiryDate;

    private TokenType type;

    public enum TokenType {
        VERIFY_EMAIL,
        RESET_PASSWORD
    }

    public VerificationToken(User user, TokenType type, long expiryMinutes) {
        this.user = user;
        this.type = type;
        this.token = UUID.randomUUID().toString();
        // Tính thời gian hết hạn dựa trên tham số truyền vào
        this.expiryDate = LocalDateTime.now().plusMinutes(expiryMinutes);
    }
}