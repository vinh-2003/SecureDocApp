package com.securedoc.backend.service;

import com.securedoc.backend.dto.file.ShareFileRequest;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPermissionRole;
import com.securedoc.backend.enums.EPublicAccess;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.UserRepository;
import com.securedoc.backend.repository.elasticsearch.DocumentIndexRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileShareService {

    private final FileNodeRepository fileNodeRepository;
    private final UserRepository userRepository;
    private final DocumentIndexRepository documentIndexRepository;

    // ==========================================================
    // 1. CHECK QUYỀN (HELPER)
    // ==========================================================

    public boolean hasReadAccess(FileNode node, String userId) {
        if (node.getOwnerId().equals(userId)) return true;
        if (node.getPublicAccess() != EPublicAccess.PRIVATE) return true;
        return node.getPermissions().stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canView());
    }

    public boolean hasEditAccess(FileNode node, String userId) {
        if (node.getOwnerId().equals(userId)) return true;
        if (node.getPublicAccess() == EPublicAccess.PUBLIC_EDIT) return true;
        return node.getPermissions().stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canEdit());
    }

    public boolean hasShareAccess(FileNode node, String userId) {
        return node.getOwnerId().equals(userId);
    }

    // ==========================================================
    // 2. CHIA SẺ TÀI LIỆU (SHARE)
    // ==========================================================

    @Transactional
    public void shareFile(String fileId, ShareFileRequest request, String currentUserId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!hasShareAccess(node, currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        if (targetUser.getId().equals(node.getOwnerId())) return;

        // BẮT ĐẦU QUY TRÌNH DOMINO
        applySharePermissionRecursive(node, targetUser.getId(), request.getRole(), true);
    }

    /**
     * Hàm đệ quy thông minh: Xử lý cả Xuống (Downward) và Lên (Upward)
     * @param node: Node đang xét
     * @param targetUserId: Người được share
     * @param newRole: Quyền mới
     * @param checkUpward: Có cần kiểm tra ngược lên cha không?
     * (True khi gọi lần đầu từ con, False khi cha gọi xuống con để tránh lặp vô tận)
     */
    private void applySharePermissionRecursive(FileNode node, String targetUserId, EPermissionRole newRole, boolean checkUpward) {
        // 1. Apply cho chính nó
        addOrUpdatePermission(node, targetUserId, newRole);
        fileNodeRepository.save(node);
        syncOneNodeToElastic(node); // Sync ngay để đảm bảo nhất quán

        // 2. LAN TRUYỀN XUỐNG (Downward): Áp dụng cho tất cả con cháu
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
                // Gọi đệ quy xuống con, NHƯNG tắt checkUpward (vì ta đang đi xuống)
                applySharePermissionRecursive(child, targetUserId, newRole, false);
            }
        }

        // 3. LAN TRUYỀN LÊN (Upward Restriction): Chỉ chạy nếu checkUpward = true
        if (checkUpward && node.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);
            if (parent != null) {
                Optional<FileNode.FilePermission> parentPerm = parent.getPermissions().stream()
                        .filter(p -> p.getUserId().equals(targetUserId))
                        .findFirst();

                // Nếu Cha chưa có quyền, hoặc Cha có quyền cao hơn Con
                // -> Phải hạ Cha xuống bằng quyền Con (Restrict)
                // Ví dụ: Con set VIEWER (1), Cha đang EDITOR (3) -> Cha phải xuống VIEWER (1)
                if (parentPerm.isPresent()) {
                    EPermissionRole currentParentRole = parentPerm.get().getRole();
                    if (currentParentRole.getLevel() > newRole.getLevel()) {
                        // Gọi đệ quy ngược lên Cha
                        // Lưu ý: Lúc này Cha thay đổi quyền, Cha lại phải lan truyền xuống các con khác
                        // Nên tham số checkUpward vẫn là true để nó tiếp tục leo lên Ông, Cố...
                        applySharePermissionRecursive(parent, targetUserId, newRole, true);
                    }
                }
            }
        }
    }

    // ==========================================================
    // 3. GỠ BỎ QUYỀN (REVOKE)
    // ==========================================================

    @Transactional
    public void revokeAccess(String fileId, String email, String currentUserId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!hasShareAccess(node, currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        User targetUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));

        // BẮT ĐẦU QUY TRÌNH DOMINO GỠ QUYỀN
        applyRevokePermissionRecursive(node, targetUser.getId(), true);
    }

    private void applyRevokePermissionRecursive(FileNode node, String targetUserId, boolean checkUpward) {
        // 1. Xóa quyền khỏi node hiện tại
        boolean removed = node.getPermissions().removeIf(p -> p.getUserId().equals(targetUserId));

        // Nếu node này vốn dĩ không có quyền user đó thì không cần làm gì thêm (tránh loop thừa)
        // Tuy nhiên với logic lan truyền, ta cứ quét cho chắc.
        fileNodeRepository.save(node);
        syncOneNodeToElastic(node);

        // 2. LAN TRUYỀN XUỐNG (Downward): Gỡ quyền tất cả con cháu
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
                applyRevokePermissionRecursive(child, targetUserId, false);
            }
        }

        // 3. LAN TRUYỀN LÊN (Upward Restriction)
        // Nếu gỡ quyền ở Con -> Phải gỡ quyền ở Cha (để đảm bảo không lách luật)
        if (checkUpward && node.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);
            if (parent != null) {
                boolean parentHasUser = parent.getPermissions().stream()
                        .anyMatch(p -> p.getUserId().equals(targetUserId));

                if (parentHasUser) {
                    // Gọi đệ quy lên cha để gỡ quyền cha
                    applyRevokePermissionRecursive(parent, targetUserId, true);
                }
            }
        }
    }

    // ==========================================================
    // 4. THAY ĐỔI QUYỀN PUBLIC
    // ==========================================================

    @Transactional
    public void changePublicAccess(String fileId, EPublicAccess newAccess, String currentUserId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!node.getOwnerId().equals(currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        applyPublicAccessRecursive(node, newAccess, true);
    }

    private void applyPublicAccessRecursive(FileNode node, EPublicAccess newAccess, boolean checkUpward) {
        // 1. Apply
        node.setPublicAccess(newAccess);
        fileNodeRepository.save(node);
        syncOneNodeToElastic(node);

        // 2. Downward
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
                applyPublicAccessRecursive(child, newAccess, false);
            }
        }

        // 3. Upward
        if (checkUpward && node.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);
            if (parent != null) {
                // Nếu quyền Cha (Cao) > quyền Con (Thấp) -> Hạ quyền Cha
                // VD: Cha (Public Edit) > Con (Private) -> Cha phải thành Private
                if (parent.getPublicAccess().getLevel() > newAccess.getLevel()) {
                    applyPublicAccessRecursive(parent, newAccess, true);
                }
            }
        }
    }

    // ==========================================================
    // HELPER FUNCTIONS
    // ==========================================================

    private void addOrUpdatePermission(FileNode node, String userId, EPermissionRole role) {
        Optional<FileNode.FilePermission> existing = node.getPermissions().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setRole(role);
        } else {
            node.getPermissions().add(new FileNode.FilePermission(userId, role));
        }
    }

    // Đồng bộ 1 node sang Elastic (Để dùng trong vòng lặp đệ quy)
    private void syncOneNodeToElastic(FileNode node) {
        DocumentIndex doc = documentIndexRepository.findById(node.getId()).orElse(null);
        if (doc != null) {
            List<String> allowed = new ArrayList<>();
            allowed.add(node.getOwnerId());
//            if (node.getPublicAccess() != EPublicAccess.PRIVATE) allowed.add("PUBLIC");
            node.getPermissions().forEach(p -> allowed.add(p.getUserId()));

            doc.setAllowedUsers(allowed);
            documentIndexRepository.save(doc);
        }
    }
}