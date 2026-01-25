package com.securedoc.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.enums.EPermissionRole;
import com.securedoc.backend.enums.EPublicAccess;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.FileNodeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final FileNodeRepository fileNodeRepository;

    // Khoảng cách quyền lực giữa các thế hệ (Dùng cho buildPowerMap)
    private static final int GENERATION_GAP = 10;

    // ==========================================================
    // 1. KIỂM TRA QUYỀN TRUY CẬP (READ/EDIT)
    // ==========================================================

    /**
     * Kiểm tra quyền ĐỌC (VIEW)
     * Rule: Owner OR Public != PRIVATE OR In Permission List (Viewer/Editor) OR Ancestor Permission
     */
    public boolean hasReadAccess(FileNode node, String userId) {
        // 1. Chính chủ
        if (node.getOwnerId().equals(userId)) {
            return true;
        }

        // 2. Public
        if (node.getPublicAccess() != EPublicAccess.PRIVATE) {
            return true;
        }

        // 3. Check trong list Permission trực tiếp
        if (node.getPermissions().stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canView())) {
            return true;
        }

        // 4. Check quyền từ tổ tiên (The Ancestor Check)
        return checkAncestorPower(node, userId);
    }

    /**
     * Kiểm tra quyền GHI (EDIT)
     * Rule: Owner OR Public == PUBLIC_EDIT OR In Permission List (Editor) OR Ancestor Permission
     */
    public boolean hasEditAccess(FileNode node, String userId) {
        // 1. Chính chủ
        if (node.getOwnerId().equals(userId)) {
            return true;
        }

        // 2. Public Edit
        if (node.getPublicAccess() == EPublicAccess.PUBLIC_EDIT) {
            return true;
        }

        // 3. Check trong list Permission trực tiếp (Phải là EDITOR)
        if (node.getPermissions().stream()
                .anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canEdit())) {
            return true;
        }

        // 4. Check quyền từ tổ tiên
        return checkAncestorPower(node, userId);
    }

    // ==========================================================
    // 2. LOGIC QUYỀN LỰC TỔ TIÊN & POWER MAP
    // ==========================================================

    /**
     * Kiểm tra xem user có quyền lực từ cấp cha/ông không.
     * Logic: Nếu là Owner hoặc Editor của bất kỳ thư mục cha nào -> Có quyền sinh sát con.
     */
    public boolean checkAncestorPower(FileNode node, String userId) {
        if (node.getAncestors() == null || node.getAncestors().isEmpty()) {
            return false;
        }

        // Query Batch tất cả tổ tiên để tối ưu performance
        List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());

        for (FileNode ancestor : ancestors) {
            // Nếu là Owner của bất kỳ cha nào -> Full quyền
            if (ancestor.getOwnerId().equals(userId)) {
                return true;
            }

            // Nếu là Editor của cha -> Có quyền
            boolean isEditor = ancestor.getPermissions().stream()
                    .anyMatch(p -> p.getUserId().equals(userId) && p.getRole() == EPermissionRole.EDITOR);
            if (isEditor) {
                return true;
            }
        }
        return false;
    }

    /**
     * Kiểm tra xem User có phải là "Lãnh Chúa" (Chủ sở hữu tối cao) không.
     * Return True nếu: User là Owner của Node HOẶC Owner của bất kỳ Tổ tiên nào.
     */
    public boolean isLandlord(FileNode node, String userId) {
        // 1. Chính chủ folder này
        if (node.getOwnerId().equals(userId)) {
            return true;
        }

        // 2. Chủ của các đời tổ tiên
        return checkAncestorOwner(node, userId);
    }

    private boolean checkAncestorOwner(FileNode node, String userId) {
        if (node.getAncestors() == null || node.getAncestors().isEmpty()) {
            return false;
        }
        List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());
        for (FileNode ancestor : ancestors) {
            if (ancestor.getOwnerId().equals(userId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Xây dựng bản đồ quyền lực (Rank) cho 1 Node dựa trên tổ tiên.
     * Dùng cho logic Share/Revoke để so sánh quyền hạn.
     * Rank càng nhỏ -> Quyền càng lớn (Owner=0, Editor=1).
     */
    public Map<String, Integer> buildPowerMap(FileNode targetNode) {
        Map<String, Integer> powerMap = new HashMap<>();

        // 1. Lấy list ID: Ancestors + Node hiện tại
        List<String> lineageIds = new ArrayList<>(targetNode.getAncestors());
        lineageIds.add(targetNode.getId());

        List<FileNode> lineageNodes = fileNodeRepository.findAllById(lineageIds);
        Map<String, FileNode> nodeMap = lineageNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, node -> node));

        // 2. Duyệt từ trên xuống dưới (Root -> Current)
        int currentBaseRank = 0;

        for (String nodeId : lineageIds) {
            FileNode node = nodeMap.get(nodeId);
            if (node == null) continue;

            // A. Quyền tối thượng: OWNER
            powerMap.putIfAbsent(node.getOwnerId(), currentBaseRank);

            // B. Quyền cấp phó: EDITOR
            if (node.getPermissions() != null) {
                for (FileNode.FilePermission perm : node.getPermissions()) {
                    if (perm.getRole() == EPermissionRole.EDITOR) {
                        // Editor thua Owner 1 điểm
                        powerMap.putIfAbsent(perm.getUserId(), currentBaseRank + 1);
                    }
                }
            }

            // Xuống cấp tiếp theo -> Tăng Rank (giảm quyền lực)
            currentBaseRank += GENERATION_GAP;
        }

        return powerMap;
    }

    /**
     * Validate quyền lực: Kiểm tra Actor có đủ Rank để tác động lên TargetUser không.
     * Quy tắc: Rank(Actor) <= Rank(Target).
     */
    public void validatePowerCheck(String actorId, String targetUserId, Map<String, Integer> powerMap) {
        Integer actorRank = powerMap.getOrDefault(actorId, Integer.MAX_VALUE);

        // Actor phải có quyền (Rank < Max)
        if (actorRank == Integer.MAX_VALUE) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        Integer targetRank = powerMap.getOrDefault(targetUserId, Integer.MAX_VALUE);

        // Nếu Target quyền to hơn Actor -> Chặn
        if (targetRank < actorRank) {
            throw new AppException(AppErrorCode.NOT_ENOUGH_PERMISSION);
        }
    }
}