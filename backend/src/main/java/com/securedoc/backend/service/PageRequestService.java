package com.securedoc.backend.service;

import com.securedoc.backend.entity.*;
import com.securedoc.backend.enums.ERequestStatus;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PageRequestService {

    private final PageAccessRequestRepository requestRepository;
    private final FileNodeRepository fileNodeRepository;
    private final UserPageAccessRepository userPageAccessRepository;

    // --- 1. NGƯỜI DÙNG GỬI YÊU CẦU ---
    public PageAccessRequest createRequest(String userId, String fileId, List<Integer> pageIndexes, String reason) {
        FileNode file = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (file.getOwnerId().equals(userId)) {
            throw new AppException(AppErrorCode.OWNER_CREATE_REQUEST);
        }

        // TODO: Có thể check xem đã có request PENDING cho các trang này chưa để tránh spam

        PageAccessRequest request = PageAccessRequest.builder()
                .fileId(fileId)
                .ownerId(file.getOwnerId())
                .requesterId(userId)
                .pageIndexes(pageIndexes)
                .reason(reason)
                .status(ERequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return requestRepository.save(request);
    }

    // --- 2. CHỦ SỞ HỮU DUYỆT YÊU CẦU ---
    @Transactional
    public void processRequest(String requestId, String ownerId, boolean isApproved) {
        PageAccessRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(AppErrorCode.RESOURCE_NOT_FOUND));

        // Check xem người thao tác có phải là Owner của file trong request không
        if (!request.getOwnerId().equals(ownerId)) {
            throw new AppException(AppErrorCode.UNAUTHORIZED);
        }

        if (request.getStatus() != ERequestStatus.PENDING) {
            throw new AppException(AppErrorCode.REQUEST_HANDLED);
        }

        if (isApproved) {
            request.setStatus(ERequestStatus.APPROVED);

            // QUAN TRỌNG: Cấp quyền vào bảng UserPageAccess
            List<UserPageAccess> newAccessList = new ArrayList<>();
            for (Integer pageIndex : request.getPageIndexes()) {
                // Check xem đã có quyền chưa để tránh duplicate (dù DB có unique index rồi nhưng check code vẫn hơn)
                boolean exists = userPageAccessRepository.existsByUserIdAndFileIdAndPageIndex(
                        request.getRequesterId(), request.getFileId(), pageIndex
                );

                if (!exists) {
                    newAccessList.add(UserPageAccess.builder()
                            .userId(request.getRequesterId())
                            .fileId(request.getFileId())
                            .pageIndex(pageIndex)
                            .grantedAt(System.currentTimeMillis())
                            .build());
                }
            }
            if (!newAccessList.isEmpty()) {
                userPageAccessRepository.saveAll(newAccessList);
            }

        } else {
            request.setStatus(ERequestStatus.REJECTED);
        }

        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
    }

    // --- 3. LẤY DANH SÁCH REQUEST (Cho Owner) ---
    public List<PageAccessRequest> getRequestsForOwner(String ownerId) {
        return requestRepository.findByOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, ERequestStatus.PENDING);
    }
}