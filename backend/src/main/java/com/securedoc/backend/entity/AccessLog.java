package com.securedoc.backend.entity;

import com.securedoc.backend.enums.EAccessAction;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "access_logs")
public class AccessLog {
    @Id
    private String id;

    @Indexed
    private String userId; // Null nếu login thất bại với username sai

    @Indexed
    private String username; // Luôn lưu username người dùng nhập vào

    private EAccessAction action; // LOGIN, LOGOUT...

    private boolean isSuccess; // true/false

    private String errorMessage; // Lý do thất bại (nếu có)

    private String ipAddress; // IP người dùng

    private String userAgent; // Thông tin trình duyệt/thiết bị

    @Indexed
    private LocalDateTime timestamp; // Thời gian truy cập
}