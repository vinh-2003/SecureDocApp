package com.securedoc.backend.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileStatusMessage {
    private String fileId;
    private String status; // "AVAILABLE", "FAILED"
    private String fileName;
}