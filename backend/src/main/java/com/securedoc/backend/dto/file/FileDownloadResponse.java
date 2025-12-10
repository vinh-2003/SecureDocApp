package com.securedoc.backend.dto.file;

import lombok.Builder;
import lombok.Data;
import org.springframework.core.io.InputStreamResource;

@Data
@Builder
public class FileDownloadResponse {
    private String fileName;
    private String contentType; // MIME Type
    private long fileSize;
    private InputStreamResource stream; // Dòng chảy dữ liệu đã giải mã
}