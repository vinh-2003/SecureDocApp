package com.securedoc.backend.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "file_keys")
public class FileKey {
    @Id
    private String id;

    private String fileNodeId; // Khóa này thuộc về file nào

    // File Key (AES-256) đã được mã hóa bằng Master Key
    private String encryptedKey;

    private String algorithm; // "AES"
    private Integer masterKeyVersion; // Version của Master Key

    @CreatedDate
    private LocalDateTime createdAt;
}