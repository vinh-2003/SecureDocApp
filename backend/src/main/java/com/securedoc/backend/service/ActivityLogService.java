package com.securedoc.backend.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.securedoc.backend.dto.request.ActivityFilterRequest;
import com.securedoc.backend.dto.response.ActivityLogPageResponse;
import com.securedoc.backend.dto.response.ActivityLogResponse;
import com.securedoc.backend.entity.ActivityLog;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.User;
import com.securedoc.backend.enums.EActivityType;
import com.securedoc.backend.enums.EFileType;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.repository.ActivityLogRepository;
import com.securedoc.backend.repository.FileNodeRepository;
import com.securedoc.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final FileNodeRepository fileNodeRepository;
    private final PermissionService permissionService;
    private final UserRepository userRepository;

    // ===================================================================
    // 1. GHI LOG (ASYNC - Không block main thread)
    // ===================================================================
    /**
     * Ghi log hành động (Async). Được gọi từ các Service khác sau khi thực hiện
     * action thành công.
     */
    @Async("activityLogExecutor")
    public CompletableFuture<Void> logActivityAsync(
            EActivityType actionType,
            FileNode targetNode,
            User actor,
            Map<String, Object> details
    ) {
        try {
            ActivityLog activityLog = ActivityLog.builder()
                    .actionType(actionType)
                    .targetNodeId(targetNode.getId())
                    .targetNodeName(targetNode.getName())
                    .targetNodeType(targetNode.getType())
                    .targetNodeOwnerId(targetNode.getOwnerId())
                    .ancestorIds(ActivityLog.buildAncestorIds(targetNode))
                    .actorId(actor.getId())
                    .actorName(actor.getFullName())
                    .actorEmail(actor.getEmail())
                    .actorAvatarUrl(actor.getAvatarUrl())
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);
            log.debug("Activity logged: {} on {} by {}", actionType, targetNode.getName(), actor.getEmail());

        } catch (Exception e) {
            // Log lỗi nhưng không throw để không ảnh hưởng main flow
            log.error("Failed to log activity: {} - {}", actionType, e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
    }

    /**
     * Overload: Ghi log với actorId (sẽ fetch User từ DB)
     */
    @Async("activityLogExecutor")
    public CompletableFuture<Void> logActivityAsync(
            EActivityType actionType,
            FileNode targetNode,
            String actorId,
            Map<String, Object> details
    ) {
        User actor = userRepository.findById(actorId).orElse(null);
        if (actor == null) {
            log.warn("Actor not found for activity log: {}", actorId);
            return CompletableFuture.completedFuture(null);
        }
        return logActivityAsync(actionType, targetNode, actor, details);
    }

    // ===================================================================
    // 2. CÁC HÀM LOG TIỆN ÍCH (Facade Pattern)
    // ===================================================================
    public void logFileUploaded(FileNode node, String actorId) {
        logActivityAsync(EActivityType.FILE_UPLOADED, node, actorId, Map.of(
                "size", node.getSize(),
                "mimeType", node.getMimeType()
        ));
    }

    public void logFolderCreated(FileNode node, String actorId) {
        logActivityAsync(EActivityType.FOLDER_CREATED, node, actorId, null);
    }

    public void logRenamed(FileNode node, String oldName, String actorId) {
        logActivityAsync(EActivityType.RENAMED, node, actorId, Map.of(
                "oldName", oldName,
                "newName", node.getName()
        ));
    }

    public void logDescriptionUpdated(FileNode node, String oldDescription, String actorId) {
        logActivityAsync(EActivityType.DESCRIPTION_UPDATED, node, actorId, Map.of(
                "oldDescription", oldDescription != null ? oldDescription : "",
                "newDescription", node.getDescription() != null ? node.getDescription() : ""
        ));
    }

    public void logMoved(FileNode node, String fromParentId, String fromPath, String toPath, String actorId) {
        logActivityAsync(EActivityType.MOVED, node, actorId, Map.of(
                "fromParentId", fromParentId != null ? fromParentId : "root",
                "toParentId", node.getParentId() != null ? node.getParentId() : "root",
                "fromPath", fromPath,
                "toPath", toPath
        ));
    }

    public void logTrashed(FileNode node, String actorId) {
        logActivityAsync(EActivityType.TRASHED, node, actorId, null);
    }

    public void logRestored(FileNode node, String actorId) {
        logActivityAsync(EActivityType.RESTORED, node, actorId, null);
    }

    public void logDeletedPermanently(FileNode node, String actorId) {
        // Lưu snapshot vì node sắp bị xóa
        logActivityAsync(EActivityType.DELETED_PERMANENTLY, node, actorId, Map.of(
                "deletedNodeName", node.getName(),
                "deletedNodeType", node.getType().name()
        ));
    }

    public void logCopied(FileNode originalNode, FileNode copiedNode, String actorId) {
        logActivityAsync(EActivityType.COPIED, copiedNode, actorId, Map.of(
                "originalNodeId", originalNode.getId(),
                "originalNodeName", originalNode.getName()
        ));
    }

    public void logDownloaded(FileNode node, String actorId) {
        logActivityAsync(EActivityType.DOWNLOADED, node, actorId, null);
    }

    public void logShared(FileNode node, User targetUser, String role, String actorId) {
        logActivityAsync(EActivityType.SHARED, node, actorId, Map.of(
                "targetUserId", targetUser.getId(),
                "targetUserName", targetUser.getFullName(),
                "targetUserEmail", targetUser.getEmail(),
                "role", role
        ));
    }

    public void logRevoked(FileNode node, User targetUser, String actorId) {
        logActivityAsync(EActivityType.REVOKED, node, actorId, Map.of(
                "targetUserId", targetUser.getId(),
                "targetUserName", targetUser.getFullName(),
                "targetUserEmail", targetUser.getEmail()
        ));
    }

    public void logPublicAccessChanged(FileNode node, String oldAccess, String newAccess, String actorId) {
        logActivityAsync(EActivityType.PUBLIC_ACCESS_CHANGED, node, actorId, Map.of(
                "oldAccess", oldAccess,
                "newAccess", newAccess
        ));
    }

    // ===================================================================
    // 3. QUERY ACTIVITIES
    // ===================================================================
    /**
     * Lấy activity của một node (bao gồm con cháu nếu là Folder). Có kiểm tra
     * quyền truy cập.
     */
    public ActivityLogPageResponse getActivitiesByNode(
            String nodeId,
            String currentUserId,
            ActivityFilterRequest filter
    ) {
        // 1. Validate node tồn tại và user có quyền
        FileNode node = fileNodeRepository.findById(nodeId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!permissionService.hasReadAccess(node, currentUserId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        // 2. Build Pageable
        Pageable pageable = PageRequest.of(
                filter.getPage(),
                filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        // 3. Query dựa trên loại node
        Page<ActivityLog> activityPage;

        if (node.getType() == EFileType.FOLDER) {
            // Folder:  Lấy activity của cả con cháu
            if (hasFilters(filter)) {
                activityPage = activityLogRepository.findWithFilters(
                        nodeId,
                        filter.getActionTypes(),
                        filter.getActorId(),
                        filter.getFromDate(),
                        filter.getToDate(),
                        pageable
                );
            } else {
                activityPage = activityLogRepository
                        .findByAncestorIdsContainingOrderByCreatedAtDesc(nodeId, pageable);
            }
        } else {
            // File: Chỉ lấy activity của chính nó
            activityPage = activityLogRepository
                    .findByTargetNodeIdOrderByCreatedAtDesc(nodeId, pageable);
        }

        // 4. Filter theo quyền truy cập và convert to DTO
        List<ActivityLogResponse> responses = filterAndConvertActivities(
                activityPage.getContent(),
                currentUserId
        );

        return ActivityLogPageResponse.builder()
                .activities(responses)
                .currentPage(activityPage.getNumber())
                .totalPages(activityPage.getTotalPages())
                .totalElements(activityPage.getTotalElements())
                .hasNext(activityPage.hasNext())
                .hasPrevious(activityPage.hasPrevious())
                .build();
    }

    /**
     * Lấy activity của current user (My Activity).
     */
    public ActivityLogPageResponse getMyActivities(String currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ActivityLog> activityPage = activityLogRepository
                .findByActorIdOrderByCreatedAtDesc(currentUserId, pageable);

        List<ActivityLogResponse> responses = filterAndConvertActivities(
                activityPage.getContent(),
                currentUserId
        );

        return ActivityLogPageResponse.builder()
                .activities(responses)
                .currentPage(activityPage.getNumber())
                .totalPages(activityPage.getTotalPages())
                .totalElements(activityPage.getTotalElements())
                .hasNext(activityPage.hasNext())
                .hasPrevious(activityPage.hasPrevious())
                .build();
    }

    /**
     * Lấy activity gần đây trên toàn hệ thống (cho Dashboard). Chỉ trả về
     * activities mà user có quyền xem.
     */
    public List<ActivityLogResponse> getRecentActivities(String currentUserId, int limit) {
        // Lấy nhiều hơn limit để có đủ sau khi filter quyền
        Pageable pageable = PageRequest.of(0, limit * 3, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Query tất cả activity gần đây
        Page<ActivityLog> activityPage = activityLogRepository.findAll(pageable);

        // Filter theo quyền và giới hạn số lượng
        return filterAndConvertActivities(activityPage.getContent(), currentUserId)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ===================================================================
    // 4. HELPER METHODS
    // ===================================================================
    /**
     * Filter activities theo quyền truy cập và convert sang DTO.
     */
    private List<ActivityLogResponse> filterAndConvertActivities(
            List<ActivityLog> activities,
            String currentUserId
    ) {
        if (activities.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. Batch load các FileNode để check quyền
        Set<String> nodeIds = activities.stream()
                .map(ActivityLog::getTargetNodeId)
                .collect(Collectors.toSet());

        Map<String, FileNode> nodeMap = fileNodeRepository.findAllById(nodeIds)
                .stream()
                .collect(Collectors.toMap(FileNode::getId, node -> node));

        // 2. Filter và convert
        return activities.stream()
                .filter(activity -> {
                    FileNode node = nodeMap.get(activity.getTargetNodeId());

                    // Nếu node không tồn tại (đã bị xóa vĩnh viễn)
                    if (node == null) {
                        // Cho phép xem nếu user là actor hoặc là owner gốc
                        return activity.getActorId().equals(currentUserId)
                                || activity.getTargetNodeOwnerId().equals(currentUserId);
                    }

                    // Check quyền truy cập
                    return permissionService.hasReadAccess(node, currentUserId);
                })
                .map(activity -> convertToResponse(activity, nodeMap.get(activity.getTargetNodeId())))
                .collect(Collectors.toList());
    }

    /**
     * Convert ActivityLog entity sang Response DTO.
     */
    private ActivityLogResponse convertToResponse(ActivityLog activity, FileNode currentNode) {
        return ActivityLogResponse.builder()
                .id(activity.getId())
                .actionType(activity.getActionType())
                .actionDisplayText(activity.getActionType().getDisplayText())
                .actionIconType(activity.getActionType().getIconType())
                .targetNodeId(activity.getTargetNodeId())
                .targetNodeName(activity.getTargetNodeName())
                .targetNodeType(activity.getTargetNodeType())
                .targetNodeExists(currentNode != null && !currentNode.isDeleted())
                .actor(ActivityLogResponse.ActorInfo.builder()
                        .id(activity.getActorId())
                        .name(activity.getActorName())
                        .email(activity.getActorEmail())
                        .avatarUrl(activity.getActorAvatarUrl())
                        .build())
                .details(activity.getDetails())
                .createdAt(activity.getCreatedAt())
                .relativeTime(calculateRelativeTime(activity.getCreatedAt()))
                .build();
    }

    /**
     * Tính thời gian tương đối (2 phút trước, Hôm qua, .. .).
     */
    private String calculateRelativeTime(LocalDateTime time) {
        if (time == null) {
            return "";
        }

        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(time, now);
        long hours = ChronoUnit.HOURS.between(time, now);
        long days = ChronoUnit.DAYS.between(time, now);

        if (minutes < 1) {
            return "Vừa xong";
        }
        if (minutes < 60) {
            return minutes + " phút trước";
        }
        if (hours < 24) {
            return hours + " giờ trước";
        }
        if (days == 1) {
            return "Hôm qua";
        }
        if (days < 7) {
            return days + " ngày trước";
        }
        if (days < 30) {
            return (days / 7) + " tuần trước";
        }
        if (days < 365) {
            return (days / 30) + " tháng trước";
        }
        return (days / 365) + " năm trước";
    }

    /**
     * Check xem filter có giá trị hay không.
     */
    private boolean hasFilters(ActivityFilterRequest filter) {
        return (filter.getActionTypes() != null && !filter.getActionTypes().isEmpty())
                || filter.getActorId() != null
                || filter.getFromDate() != null
                || filter.getToDate() != null;
    }

    // ===================================================================
    // 5. CLEANUP (Scheduled Job)
    // ===================================================================
    /**
     * Xóa activity logs cũ hơn X ngày (gọi từ Scheduled Job).
     */
    public void cleanupOldActivities(int retentionDays) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        activityLogRepository.deleteByCreatedAtBefore(threshold);
        log.info("Cleaned up activity logs older than {} days", retentionDays);
    }

    /**
     * Xóa activity của một node (khi xóa vĩnh viễn file).
     */
    public void deleteActivitiesByNode(String nodeId) {
        activityLogRepository.deleteAllByTargetNodeId(nodeId);
    }
}
