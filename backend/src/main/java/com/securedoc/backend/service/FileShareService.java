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
import com.securedoc.backend.service.elasticsearch.DocumentIndexService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileShareService {

    private final FileNodeRepository fileNodeRepository;
    private final UserRepository userRepository;
    private final DocumentIndexService documentIndexService;

    // Khoảng cách quyền lực giữa các thế hệ
    private static final int GENERATION_GAP = 10;

    // ==========================================================
    // 1. CORE LOGIC: POWER MAP (BẢN ĐỒ QUYỀN LỰC)
    // ==========================================================

    /**
     * Xây dựng bản đồ quyền lực cho 1 Node dựa trên tổ tiên của nó.
     * Output: Map<UserId, Rank> (Rank càng nhỏ quyền càng to)
     */
    private Map<String, Integer> buildPowerMap(FileNode targetNode) {
        Map<String, Integer> powerMap = new HashMap<>();

        // 1. Lấy toàn bộ tổ tiên (Ancestors) + Node hiện tại
        // Sắp xếp từ Gốc -> Ngọn (Ancestors list thường lưu từ root -> parent)
        List<String> lineageIds = new ArrayList<>(targetNode.getAncestors());
        lineageIds.add(targetNode.getId());

        List<FileNode> lineageNodes = fileNodeRepository.findAllById(lineageIds);

        // Map để truy xuất nhanh node theo ID
        Map<String, FileNode> nodeMap = lineageNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, node -> node));

        // 2. Duyệt từ trên xuống dưới để gán Rank
        // Root có baseRank = 0, Cấp 1 = 10, Cấp 2 = 20...
        int currentBaseRank = 0;

        for (String nodeId : lineageIds) {
            FileNode node = nodeMap.get(nodeId);
            if (node == null) continue;

            // A. Quyền tối thượng: OWNER của Node này
            // Nếu User này đã có rank cao hơn (từ cấp cha) thì giữ nguyên, không thì gán rank mới
            powerMap.putIfAbsent(node.getOwnerId(), currentBaseRank);

            // B. Quyền cấp phó: EDITOR của Node này
            if (node.getPermissions() != null) {
                for (FileNode.FilePermission perm : node.getPermissions()) {
                    if (perm.getRole() == EPermissionRole.EDITOR) {
                        // Editor thua Owner 1 điểm (Ví dụ: Owner=0, Editor=1)
                        powerMap.putIfAbsent(perm.getUserId(), currentBaseRank + 1);
                    }
                }
            }

            // Xuống cấp tiếp theo -> Tăng Rank (Quyền lực giảm đi)
            currentBaseRank += GENERATION_GAP;
        }

        return powerMap;
    }

    /**
     * Kiểm tra xem Actor (người thực hiện) có đủ quyền lực để tác động lên Target (nạn nhân) không.
     * Quy tắc: Rank(Actor) <= Rank(Target).
     * (Vị vua có thể chém thường dân, nhưng thường dân không thể chém vua)
     */
    private void validatePowerCheck(String actorId, String targetUserId, Map<String, Integer> powerMap) {
        // 1. Xác định Rank của Actor
        // Nếu Actor không có trong bản đồ -> Rank vô cực (Không có quyền gì cả)
        Integer actorRank = powerMap.getOrDefault(actorId, Integer.MAX_VALUE);

        // Actor phải có ít nhất quyền Editor tại node hiện tại (Rank < Max)
        // Trong thực tế, logic check quyền Edit đã làm ở ngoài, nhưng check lại cho chắc
        if (actorRank == Integer.MAX_VALUE) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 2. Xác định Rank của Target User (Người đang bị chỉnh sửa quyền)
        Integer targetRank = powerMap.getOrDefault(targetUserId, Integer.MAX_VALUE);

        // 3. So sánh
        // Nếu Target có quyền lực cao hơn (Rank nhỏ hơn) -> Chặn ngay
        if (targetRank < actorRank) {
            throw new AppException(AppErrorCode.NOT_ENOUGH_PERMISSION);
        }
    }

    // ==========================================================
    // 2. CHỨC NĂNG CHIA SẺ (SHARE)
    // ==========================================================

    @Transactional
    public void shareFile(String fileId, ShareFileRequest request, String actorId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 1. Kiểm tra quyền cơ bản (Phải là EDITOR hoặc OWNER mới được share)
        if (!hasEditAccess(node, actorId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));
        String targetUserId = targetUser.getId();

        // 2. [QUAN TRỌNG] Xây dựng Bản đồ Quyền lực
        Map<String, Integer> powerMap = buildPowerMap(node);

        // 3. [QUAN TRỌNG] Check: Actor có được phép chỉnh sửa Target không?
        validatePowerCheck(actorId, targetUserId, powerMap);

        // 4. [QUAN TRỌNG] Check: Target có phải là Owner của node này không?
        if (targetUserId.equals(node.getOwnerId())) {
            throw new AppException(AppErrorCode.SHARE_FOR_OWNER); // Không thể share cho chính chủ sở hữu
        }

        // 5. [QUAN TRỌNG] Check: Target có phải là "Thái Thượng Hoàng" (Owner của cha/ông) không?
        // Nếu Target là Owner của một ancestor -> Họ có quyền lực tuyệt đối -> Không được add vào permissions list (thừa)
        // Logic: Nếu targetUserId nằm trong powerMap với rank < rank của owner node hiện tại -> Họ là bề trên.
        Integer nodeOwnerRank = powerMap.get(node.getOwnerId());
        Integer targetRank = powerMap.getOrDefault(targetUserId, Integer.MAX_VALUE);

        if (targetRank < nodeOwnerRank) {
            // Target là cấp trên (Owner của folder cha).
            // Họ đã có quyền mặc định. Không cần add vào list permission nữa.
            // Có thể return luôn hoặc thông báo success giả.
            return;
        }

        // 6. [QUAN TRỌNG] VALIDATE TOÀN BỘ PHẠM VI TRƯỚC KHI THỰC HIỆN
        validateShareScope(node, targetUserId, request.getRole(), actorId, powerMap);

        // 7. Thực hiện chia sẻ (sau khi đã validate toàn bộ)
        applySharePermissionRecursive(node, targetUserId, request.getRole(), true, actorId);
    }

    /**
     * VALIDATE TOÀN BỘ PHẠM VI: Kiểm tra actor có quyền trên tất cả các node sẽ bị ảnh hưởng
     */
    private void validateShareScope(FileNode startNode, String targetUserId,
                                    EPermissionRole newRole, String actorId,
                                    Map<String, Integer> powerMap) {
        // A. Collect tất cả các node sẽ bị ảnh hưởng (bao gồm downward và upward)
        Set<String> affectedNodes = new HashSet<>();

        // Downward: Tất cả các node con
        collectAllChildren(startNode.getId(), affectedNodes);
        affectedNodes.remove(startNode.getId());

        // Upward: Các node cha mà targetUser có quyền cao hơn
        collectAffectedParents(startNode, targetUserId, newRole, affectedNodes);

        // B. Kiểm tra actor có quyền EDIT trên tất cả các affectedNodes không
        for (String nodeId : affectedNodes) {
            FileNode affectedNode = fileNodeRepository.findById(nodeId).orElse(null);
            if (affectedNode == null) continue;

            if (!hasEditAccess(affectedNode, actorId)) {
                throw new AppException(AppErrorCode.CANNOT_SHARE_IN_SCOPE);
            }
        }
    }

    /**
     * Thu thập tất cả node con (đệ quy)
     */
    private void collectAllChildren(String parentId, Set<String> collector) {
        collector.add(parentId);

        List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(parentId);
        for (FileNode child : children) {
            collector.add(child.getId());
            if (child.getType() == EFileType.FOLDER) {
                collectAllChildren(child.getId(), collector);
            }
        }
    }

    /**
     * Thu thập các node cha sẽ bị ảnh hưởng (khi quyền mới hạn chế hơn quyền cũ)
     */
    private void collectAffectedParents(FileNode startNode, String targetUserId,
                                        EPermissionRole newRole, Set<String> collector) {
        FileNode current = startNode;

        while (current.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(current.getParentId()).orElse(null);
            if (parent == null) break;

            // Kiểm tra targetUser có quyền ở parent không
            Optional<FileNode.FilePermission> parentPerm = parent.getPermissions().stream()
                    .filter(p -> p.getUserId().equals(targetUserId))
                    .findFirst();

            if (parentPerm.isPresent()) {
                // Nếu quyền cũ ở parent cao hơn quyền mới -> parent sẽ bị ảnh hưởng
                if (parentPerm.get().getRole().getLevel() > newRole.getLevel()) {
                    collector.add(parent.getId());
                } else {
                    // Nếu quyền cũ thấp hơn hoặc bằng, không cần kiểm tra tiếp
                    break;
                }
            } else {
                // Target không có quyền ở parent -> dừng kiểm tra upward
                break;
            }

            current = parent;
        }
    }

    /**
     * Hàm đệ quy áp dụng quyền
     */
    private void applySharePermissionRecursive(FileNode node, String targetUserId, EPermissionRole newRole, boolean checkUpward, String actorId) {
        // A. Sanitize: Nếu Target là Owner của node này -> Bỏ qua, không add vào list permissions
        if (node.getOwnerId().equals(targetUserId)) {
            // Vẫn tiếp tục đệ quy xuống con (vì con có thể khác owner), nhưng không add permission ở node này
            // Tuy nhiên, nếu là owner thì đã full quyền, việc lan truyền xuống con cháu (nếu con cháu cùng owner) là không cần thiết.
            // Nhưng nếu con cháu KHÁC owner, thì owner cha vẫn có quyền tối cao (Power Map đã cover).
            // -> Chỗ này skip save permission cho node này.
        } else {
            // Update Permissions
            addOrUpdatePermission(node, targetUserId, newRole);
            fileNodeRepository.save(node);
            documentIndexService.syncOneNodeToElastic(node);
        }

        // B. Lan truyền XUỐNG (Downward)
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
//                // Logic đệ quy xuống:
//                // Nếu quyền Mới "Mở hơn" quyền hiện tại của con -> Ghi đè con.
//                // Nếu quyền Mới "Hẹp hơn" -> Giữ nguyên con (con được quyền riêng rộng hơn).
//                // Ở đây bạn có thể tuỳ chỉnh logic Business. Thông thường Share là "Add thêm", nên cứ đè xuống.
//                if (child != null) {
//                    Optional<FileNode.FilePermission> childPerm = child.getPermissions().stream()
//                            .filter(p -> p.getUserId().equals(targetUserId))
//                            .findFirst();
//
//                    if (childPerm.isPresent()) {
//                        EPermissionRole currentChildRole = childPerm.get().getRole();
//                        if (newRole.getLevel() > currentChildRole.getLevel()) {
//                            applySharePermissionRecursive(child, targetUserId, newRole, false, actorId);
//                        }
//                    } else {
//                        // Target chưa có quyền ở child -> apply
//                        applySharePermissionRecursive(child, targetUserId, newRole, false, actorId);
//                    }
//                }
                applySharePermissionRecursive(child, targetUserId, newRole, false, actorId);
            }
        }

        // C. Lan truyền LÊN (Upward - Restrictive)
        // Chỉ thực hiện khi checkUpward = true VÀ Node cha tồn tại
        if (checkUpward && node.getParentId() != null) {
            // Cần check lại PowerMap xem Actor có quyền tác động lên Node Cha không?
            // Nếu Actor chỉ là Editor của Node con, không có quyền ở Node Cha -> Không được lan truyền lên.
            // Logic PowerMap ở đầu hàm `shareFile` đã được build dựa trên cả cây tổ tiên, nên ta dùng lại.

            // Lấy Node Cha
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);

            if (parent != null) {
                // Actor có quyền sửa cha -> Được phép lan truyền ngược
                Optional<FileNode.FilePermission> parentPerm = parent.getPermissions().stream()
                        .filter(p -> p.getUserId().equals(targetUserId))
                        .findFirst();

                if (parentPerm.isPresent()) {
                    EPermissionRole currentParentRole = parentPerm.get().getRole();
                    // Nếu quyền Cha (VD: EDITOR) > quyền Mới (VD: VIEWER) -> Hạ quyền Cha xuống
                    if (currentParentRole.getLevel() > newRole.getLevel()) {
                        applySharePermissionRecursive(parent, targetUserId, newRole, true, actorId);
                    }
                }
            }
        }
    }

    // ==========================================================
    // 3. CHECK QUYỀN (HELPER CẬP NHẬT)
    // ==========================================================

    public boolean hasReadAccess(FileNode node, String userId) {
        // 1. Chính chủ
        if (node.getOwnerId().equals(userId)) return true;

        // 2. Public
        if (node.getPublicAccess() != EPublicAccess.PRIVATE) return true;

        // 3. Check trong list Permission
        if (node.getPermissions().stream().anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canView())) {
            return true;
        }

        // 4. [QUAN TRỌNG] Check tổ tiên (The Ancestor Check)
        // Nếu user là Owner/Editor của bất kỳ node cha nào -> Auto có quyền
        // Lưu ý: Việc này có thể tốn performance nếu query DB nhiều.
        // -> Nên dùng PowerMap hoặc check ancestors ID trong DB nếu có bảng permission phẳng.
        // Để đơn giản và chính xác nhất theo yêu cầu "Liên bang":
        return checkAncestorPower(node, userId);
    }

    public boolean hasEditAccess(FileNode node, String userId) {
        if (node.getOwnerId().equals(userId)) return true;
        if (node.getPublicAccess() == EPublicAccess.PUBLIC_EDIT) return true;

        if (node.getPermissions().stream().anyMatch(p -> p.getUserId().equals(userId) && p.getRole().canEdit())) {
            return true;
        }

        // Check tổ tiên
        return checkAncestorPower(node, userId);
    }

    /**
     * Kiểm tra xem user có phải là "Thái Thượng Hoàng" (Owner/Editor cấp cao) không
     */
    private boolean checkAncestorPower(FileNode node, String userId) {
        if (node.getAncestors() == null || node.getAncestors().isEmpty()) return false;

        List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());

        for (FileNode ancestor : ancestors) {
            // Nếu là Owner của bất kỳ cha nào -> Full quyền
            if (ancestor.getOwnerId().equals(userId)) return true;

            // Nếu là Editor của cha -> Có quyền (Giả sử Editor cha có quyền sinh sát con)
            boolean isEditor = ancestor.getPermissions().stream()
                    .anyMatch(p -> p.getUserId().equals(userId) && p.getRole() == EPermissionRole.EDITOR);
            if (isEditor) return true;
        }
        return false;
    }

    // ==========================================================
// 3. GỠ BỎ QUYỀN (REVOKE) - UPDATED
// ==========================================================

    @Transactional
    public void revokeAccess(String fileId, String email, String currentUserId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 1. Kiểm tra quyền cơ bản
        if (!hasEditAccess(node, currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        User targetUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(AppErrorCode.USER_NOT_FOUND));
        String targetUserId = targetUser.getId();

        // 2. Xây dựng Power Map để kiểm tra quyền lực
        Map<String, Integer> powerMap = buildPowerMap(node);

        // 3. Kiểm tra Actor có quyền revoke Target không
        validatePowerCheck(currentUserId, targetUserId, powerMap);

        // 4. Kiểm tra Target có phải là Owner của node hiện tại không
        if (targetUserId.equals(node.getOwnerId())) {
            throw new AppException(AppErrorCode.CANNOT_REVOKE_OWNER);
        }

        // 5. Kiểm tra Target có phải là "Thái Thượng Hoàng" không
        // Nếu Target là Owner của ancestor -> Không thể revoke (họ có quyền từ tổ tiên)
        Integer nodeOwnerRank = powerMap.get(node.getOwnerId());
        Integer targetRank = powerMap.getOrDefault(targetUserId, Integer.MAX_VALUE);

        if (targetRank < nodeOwnerRank) {
            throw new AppException(AppErrorCode.CANNOT_REVOKE_SUPERIOR);
        }

        // 6. Validate toàn bộ phạm vi sẽ bị ảnh hưởng
        validateRevokeScope(node, targetUserId, currentUserId, powerMap);

        // 7. Thực hiện revoke (sau khi đã validate)
        applyRevokePermissionRecursive(node, targetUserId, true, currentUserId);
    }

    /**
     * Validate toàn bộ phạm vi sẽ bị ảnh hưởng bởi revoke
     */
    private void validateRevokeScope(FileNode startNode, String targetUserId,
                                     String actorId, Map<String, Integer> powerMap) {
        Set<String> affectedNodes = new HashSet<>();

        // Downward: Tất cả node con (bao gồm cả startNode)
        collectAllChildren(startNode.getId(), affectedNodes);
        affectedNodes.remove(startNode.getId());

        // Upward: Các node cha mà targetUser có quyền
        collectParentsForRevoke(startNode, targetUserId, affectedNodes);

        // Kiểm tra actor có quyền EDIT trên tất cả affectedNodes không
        for (String nodeId : affectedNodes) {
            FileNode affectedNode = fileNodeRepository.findById(nodeId).orElse(null);
            if (affectedNode == null) continue;

            if (!hasEditAccess(affectedNode, actorId)) {
                throw new AppException(AppErrorCode.CANNOT_REVOKE_IN_SCOPE);
            }
        }
    }

    /**
     * Thu thập các node cha mà targetUser có quyền (cần revoke)
     */
    private void collectParentsForRevoke(FileNode startNode, String targetUserId, Set<String> collector) {
        FileNode current = startNode;

        while (current.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(current.getParentId()).orElse(null);
            if (parent == null) break;

            // Kiểm tra targetUser có quyền ở parent không
            boolean hasPermission = parent.getPermissions().stream()
                    .anyMatch(p -> p.getUserId().equals(targetUserId));

            if (hasPermission) {
                collector.add(parent.getId());
                current = parent;
            } else {
                // Target không có quyền ở parent -> dừng
                break;
            }
        }
    }

    /**
     * Hàm đệ quy gỡ quyền (đã được validate)
     */
    private void applyRevokePermissionRecursive(FileNode node, String targetUserId,
                                                boolean checkUpward, String actorId) {
        // 1. Xóa quyền khỏi node hiện tại
        boolean removed = node.getPermissions().removeIf(p -> p.getUserId().equals(targetUserId));

        if (removed) {
            fileNodeRepository.save(node);
            documentIndexService.syncOneNodeToElastic(node);
        }

        // 2. LAN TRUYỀN XUỐNG (Downward): Gỡ quyền tất cả con cháu
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
                // Chỉ revoke nếu child có quyền của targetUser
                boolean childHasPermission = child.getPermissions().stream()
                        .anyMatch(p -> p.getUserId().equals(targetUserId));

                if (childHasPermission) {
                    applyRevokePermissionRecursive(child, targetUserId, false, actorId);
                }
            }
        }

        // 3. LAN TRUYỀN LÊN (Upward Restriction) - ĐÃ VALIDATE NÊN KHÔNG CẦN CHECK QUYỀN ACTOR
        if (checkUpward && node.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);
            if (parent != null) {
                boolean parentHasPermission = parent.getPermissions().stream()
                        .anyMatch(p -> p.getUserId().equals(targetUserId));

                if (parentHasPermission) {
                    applyRevokePermissionRecursive(parent, targetUserId, true, actorId);
                }
            }
        }
    }

// ==========================================================
// 4. THAY ĐỔI QUYỀN PUBLIC - UPDATED
// ==========================================================

    @Transactional
    public void changePublicAccess(String fileId, EPublicAccess newAccess, String currentUserId) {
        FileNode node = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!hasEditAccess(node, currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 2. Validate toàn bộ phạm vi sẽ bị ảnh hưởng
        validatePublicAccessScope(node, newAccess, currentUserId);

        // 3. Thực hiện thay đổi (sau khi đã validate)
        applyPublicAccessRecursive(node, newAccess, true, currentUserId);
    }

    /**
     * Validate toàn bộ phạm vi sẽ bị ảnh hưởng bởi thay đổi public access
     */
    private void validatePublicAccessScope(FileNode startNode, EPublicAccess newAccess,
                                           String actorId) {
        Set<String> affectedNodes = new HashSet<>();

        // Downward: Tất cả node con (không bao gồm startNode - đã check owner)
        collectAllChildren(startNode.getId(), affectedNodes);
        affectedNodes.remove(startNode.getId());

        // Upward: Các node cha sẽ bị ảnh hưởng (khi newAccess hạn chế hơn)
        collectParentsForPublicAccess(startNode, newAccess, affectedNodes);

        // Kiểm tra actor có phải là OWNER của tất cả affectedNodes không
        for (String nodeId : affectedNodes) {
            FileNode affectedNode = fileNodeRepository.findById(nodeId).orElse(null);
            if (affectedNode == null) continue;

            if (!hasEditAccess(affectedNode, actorId)) {
                throw new AppException(AppErrorCode.CANNOT_CHANGE_IN_SCOPE);
            }
        }
    }

    /**
     * Thu thập các node cha sẽ bị ảnh hưởng bởi thay đổi public access
     */
    private void collectParentsForPublicAccess(FileNode startNode, EPublicAccess newAccess,
                                               Set<String> collector) {
        FileNode current = startNode;

        while (current.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(current.getParentId()).orElse(null);
            if (parent == null) break;

            // Nếu public access của parent cao hơn (level lớn hơn) newAccess
            // thì parent sẽ bị hạ xuống newAccess
            if (parent.getPublicAccess().getLevel() > newAccess.getLevel()) {
                collector.add(parent.getId());
                current = parent;
            } else {
                // Parent đã có public access thấp hơn hoặc bằng -> không ảnh hưởng
                break;
            }
        }
    }

    /**
     * Hàm đệ quy thay đổi public access (đã được validate)
     */
    private void applyPublicAccessRecursive(FileNode node, EPublicAccess newAccess,
                                            boolean checkUpward, String actorId) {
        // 1. Apply thay đổi
        node.setPublicAccess(newAccess);
        fileNodeRepository.save(node);
        documentIndexService.syncOneNodeToElastic(node);

        // 2. LAN TRUYỀN XUỐNG (Downward) - ĐÃ VALIDATE NÊN KHÔNG CẦN CHECK QUYỀN
        if (node.getType() == EFileType.FOLDER) {
            List<FileNode> children = fileNodeRepository.findByParentIdAndIsDeletedFalse(node.getId());
            for (FileNode child : children) {
//                // Chỉ thay đổi nếu public access của child thấp hơn newAccess
//                if (child.getPublicAccess().getLevel() < newAccess.getLevel()) {
//                    applyPublicAccessRecursive(child, newAccess, false, actorId);
//                }
                applyPublicAccessRecursive(child, newAccess, false, actorId);
            }
        }

        // 3. LAN TRUYỀN LÊN (Upward) - ĐÃ VALIDATE NÊN KHÔNG CẦN CHECK QUYỀN
        if (checkUpward && node.getParentId() != null) {
            FileNode parent = fileNodeRepository.findById(node.getParentId()).orElse(null);
            if (parent != null) {
                // Nếu public access của parent cao hơn (level lớn hơn) newAccess
                if (parent.getPublicAccess().getLevel() > newAccess.getLevel()) {
                    applyPublicAccessRecursive(parent, newAccess, true, actorId);
                }
            }
        }
    }



    /**
     * Kiểm tra xem User có phải là "Lãnh Chúa" (Chủ sở hữu tối cao) của node này không.
     * Return True nếu: User là Owner của Node HOẶC Owner của bất kỳ Tổ tiên nào.
     */
    public boolean isLandlord(FileNode node, String userId) {
        // 1. Chính chủ folder này
        if (node.getOwnerId().equals(userId)) return true;

        // 2. Chủ của các đời tổ tiên
        return checkAncestorOwner(node, userId);
    }

    private boolean checkAncestorOwner(FileNode node, String userId) {
        if (node.getAncestors() == null || node.getAncestors().isEmpty()) return false;

        // Query Batch để tối ưu (Thay vì loop query)
        List<FileNode> ancestors = fileNodeRepository.findAllById(node.getAncestors());

        for (FileNode ancestor : ancestors) {
            if (ancestor.getOwnerId().equals(userId)) return true;
        }
        return false;
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
            node.getPermissions().add(FileNode.FilePermission.builder()
                    .userId(userId)
                    .role(role)
                    .sharedAt(LocalDateTime.now()) // <--- Lưu thời gian
                    .build());
        }
    }


}