package com.securedoc.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "file_pages")
public class FilePage {
    @Id
    private String id;

    @Indexed
    private String fileId;      // Link tới FileNode gốc

    private int pageIndex;      // Trang số mấy (0, 1, 2...)

    // Thông tin ảnh RÕ (Clear)
    private String clearGridFsId;
    private FileNode.EncryptionMetadata clearEncryptionData; // Lưu key/iv của ảnh này

    // Thông tin ảnh MỜ (Blur)
    private String blurredGridFsId;
    private FileNode.EncryptionMetadata blurredEncryptionData;

    private boolean isLocked;   // Mặc định false
    private String content;     // Text của trang này

    private int width;
    private int height;
}