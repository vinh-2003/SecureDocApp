package com.securedoc.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_page_access")
@CompoundIndex(def = "{'userId': 1, 'fileId': 1, 'pageIndex': 1}", unique = true)
public class UserPageAccess {
    @Id
    private String id;

    private String userId;
    private String fileId;
    private int pageIndex; // Trang được cấp quyền xem rõ

    private long grantedAt; // Thời điểm cấp quyền
}