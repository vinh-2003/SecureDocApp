package com.securedoc.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissions {
    // Basic
    private boolean canViewDetails;
    private boolean canDownload;
    private boolean canCopyLink;

    // Modification
    private boolean canRename;
    private boolean canUpdateDescription;
    private boolean canMove;
    private boolean canCopy;

    // Administration
    private boolean canShare;
    private boolean canDelete;      // Soft Delete
    private boolean canDeletePermanently; // Hard Delete (Chỉ Owner)
    private boolean canRestore;     // Chỉ Owner

    // Folder Specific
    private boolean canUploadFile;
    private boolean canUploadFolder;
    private boolean canCreateFolder;

    /**
     * Builder cho quyền mặc định (Không có quyền gì cả)
     */
    public static UserPermissions noPermissions() {
        return UserPermissions.builder().build();
    }
}