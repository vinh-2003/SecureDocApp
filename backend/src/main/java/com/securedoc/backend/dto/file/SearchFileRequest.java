package com.securedoc.backend.dto.file;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class SearchFileRequest {

    // 1. Tìm kiếm chung (Tên hoặc Nội dung)
    private String keyword;

    // 2. Lọc theo Loại (FILE, FOLDER hoặc pdf, docx)
    private String fileType;

    // 3. Lọc theo Chủ sở hữu
    private String ownerId;

    // 4. Lọc theo Vị trí (Tìm trong folder nào đó)
    private String locationId; // ID của folder cha

    // 5. Lọc Thùng rác (true: tìm trong thùng rác, false: tìm file sống)
    // Mặc định là false (tìm file sống)
    private Boolean inTrash = false;

    // 6. Lọc theo Ngày sửa đổi (Range)
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate; // yyyy-MM-dd

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    // 7. Phân trang
    private int page = 0;
    private int size = 20;
}