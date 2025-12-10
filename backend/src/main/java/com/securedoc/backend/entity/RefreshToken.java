package com.securedoc.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_tokens")
public class RefreshToken {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String token; // UUID String

    private LocalDateTime expiryDate;

    private String deviceInfo;
    private String ipAddress;
}