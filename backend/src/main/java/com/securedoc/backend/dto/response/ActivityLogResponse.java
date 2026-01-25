package com.securedoc.backend.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

import com.securedoc.backend.enums.EActivityType;
import com.securedoc.backend.enums.EFileType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {

    private String id;

    // === ACTION INFO ===
    private EActivityType actionType;
    private String actionDisplayText;   // "đã tải lên", "đã đổi tên"...
    private String actionIconType;      // "upload", "rename"...

    // === TARGET NODE INFO ===
    private String targetNodeId;
    private String targetNodeName;
    private EFileType targetNodeType;
    private boolean targetNodeExists;   // Để FE biết có thể click vào không

    // === ACTOR INFO ===
    private ActorInfo actor;

    // === DETAILS ===
    private Map<String, Object> details;

    // === TIME ===
    private LocalDateTime createdAt;
    private String relativeTime;        // "2 phút trước", "Hôm qua"...

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorInfo {

        private String id;
        private String name;
        private String email;
        private String avatarUrl;
    }
}
