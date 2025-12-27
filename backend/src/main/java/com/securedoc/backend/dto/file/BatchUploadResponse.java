package com.securedoc.backend.dto.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUploadResponse {
    private int totalFiles;
    private int successCount;
    private int failCount;
    private List<FileItemStatus> successfulFiles;
    private List<FileItemStatus> failedFiles;

    @Data
    @AllArgsConstructor
    public static class FileItemStatus {
        private String fileName;
        private String message;
        private FileResponse fileData; // Chỉ có nếu thành công
    }
}