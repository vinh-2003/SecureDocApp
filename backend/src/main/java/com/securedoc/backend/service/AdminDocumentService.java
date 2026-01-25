package com.securedoc.backend.service;

import com.securedoc.backend.dto.admin.AdminDocStatsResponse;
import com.securedoc.backend.dto.internal.StatsResult;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileStatus;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.repository.FileNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDocumentService {

    private final FileNodeRepository fileNodeRepository;

    /**
     * Lấy báo cáo tổng quan về tài liệu cho Dashboard Admin
     * Sử dụng Aggregation Framework của MongoDB để tối ưu hiệu suất
     */
    public AdminDocStatsResponse getDocumentStats() {
        // 1. Lấy các chỉ số tổng quan cơ bản
        long totalFiles = fileNodeRepository.countByTypeAndIsDeletedFalse(EFileType.FILE);
        long totalFolders = fileNodeRepository.countByTypeAndIsDeletedFalse(EFileType.FOLDER);

        // Lưu ý: Aggregation có thể trả về null nếu không có document nào match
        Long totalSizeObj = fileNodeRepository.getSystemTotalSize();
        long totalSize = (totalSizeObj != null) ? totalSizeObj : 0L;

        // 2. Thống kê Thùng rác (Số lượng + Dung lượng)
        StatsResult trashStats = fileNodeRepository.getSystemTrashStats();
        long trashFiles = 0;
        long trashSize = 0;
        if (trashStats != null) {
            trashFiles = trashStats.getCount();
            trashSize = trashStats.getTotalSize();
        }

        // 3. Phân bố trạng thái file (Health Check)
        // Mục đích: Admin biết bao nhiêu file đang xử lý, bao nhiêu file lỗi cần can thiệp
        List<StatsResult> statusStats = fileNodeRepository.getSystemStatusStats();
        Map<String, Long> statusMap = new HashMap<>();

        // Khởi tạo trước tất cả trạng thái với giá trị 0 để biểu đồ FE không bị thiếu cột
        for (EFileStatus s : EFileStatus.values()) {
            statusMap.put(s.name(), 0L);
        }

        // Fill dữ liệu thực tế từ DB
        if (statusStats != null) {
            for (StatsResult stat : statusStats) {
                if (stat.getId() != null) {
                    statusMap.put(stat.getId(), stat.getCount());
                }
            }
        }

        // 4. Phân bố loại file (Top 5 MimeType phổ biến nhất)
        // Mục đích: Admin biết hệ thống chủ yếu lưu trữ loại tài liệu nào (PDF, Word, Ảnh...)
        List<StatsResult> mimeTypeStats = fileNodeRepository.getSystemMimeTypeStats();

        // Dùng LinkedHashMap để giữ thứ tự sắp xếp từ cao xuống thấp của Query Top 5
        Map<String, Long> mimeTypeMap = new LinkedHashMap<>();

        if (mimeTypeStats != null) {
            for (StatsResult stat : mimeTypeStats) {
                String type = (stat.getId() != null) ? stat.getId() : "unknown";
                // Rút gọn text để hiển thị đẹp hơn trên biểu đồ (VD: "application/pdf" -> "pdf")
                String simpleType = simplifyMimeType(type);

                // Cộng dồn nếu sau khi rút gọn bị trùng tên (hiếm gặp nhưng an toàn)
                mimeTypeMap.merge(simpleType, stat.getCount(), Long::sum);
            }
        }

        // 5. Build Response
        return AdminDocStatsResponse.builder()
                .totalFiles(totalFiles)
                .totalFolders(totalFolders)
                .totalSize(totalSize)
                .trashFiles(trashFiles)
                .trashSize(trashSize)
                .statusDistribution(statusMap)
                .mimeTypeDistribution(mimeTypeMap)
                .build();
    }

    /**
     * Lấy danh sách các file đang bị lỗi (Status = FAILED)
     * Giúp Admin nhanh chóng khoanh vùng và xử lý sự cố (Retry hoặc Xóa)
     */
    public Page<FileNode> getFailedFiles(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());

        // Gọi hàm tìm kiếm đã thêm vào Repo
        return fileNodeRepository.findByStatusAndTypeAndIsDeletedFalse(
                EFileStatus.FAILED,
                EFileType.FILE,
                pageable
        );
    }

    /**
     * Helper: Đơn giản hóa MimeType cho hiển thị
     * Ví dụ:
     * - "application/pdf" -> "pdf"
     * - "image/png" -> "png"
     * - "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "docx"
     */
    private String simplifyMimeType(String mimeType) {
        if (mimeType == null) return "unknown";

        // Xử lý một số trường hợp đặc biệt của Office
        if (mimeType.contains("wordprocessingml")) return "docx";
        if (mimeType.contains("spreadsheetml")) return "xlsx";
        if (mimeType.contains("presentationml")) return "pptx";

        // Trường hợp chung: Lấy phần sau dấu "/"
        if (mimeType.contains("/")) {
            return mimeType.substring(mimeType.lastIndexOf("/") + 1);
        }

        return mimeType;
    }
}