package com.securedoc.backend.service;

import com.securedoc.backend.dto.page.FilePageResponse;
import com.securedoc.backend.dto.response.GrantedAccessDto;
import com.securedoc.backend.dto.user.UserInfoResponse;
import com.securedoc.backend.entity.*;
import com.securedoc.backend.exception.AppException;
import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.repository.*;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;
import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FilePageService {

    private final FilePageRepository filePageRepository;
    private final FileNodeRepository fileNodeRepository;
    private final FileKeyRepository fileKeyRepository;
    private final PermissionService permissionService;
    private final UserPageAccessRepository userPageAccessRepository;
    private final UserService userService;
    private final CoreFileService coreFileService;
    private final RecentFileService recentFileService;
    private final CryptoUtils cryptoUtils;

    // --- 1. LẤY DANH SÁCH TRANG ---
    public List<FilePageResponse> getPages(String fileId, String userId) {
        FileNode file = fileNodeRepository.findById(fileId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!permissionService.hasReadAccess(file, userId)) {
            throw new AppException(AppErrorCode.FILE_ACCESS_DENIED);
        }

        recentFileService.logAccess(userId, fileId);

        List<FilePage> pages = filePageRepository.findByFileIdOrderByPageIndexAsc(fileId);
        boolean isOwner = file.getOwnerId().equals(userId);

        return pages.stream().map(page -> {
            boolean hasAccess = checkPageAccess(page, userId, isOwner);

            return FilePageResponse.builder()
                    .id(page.getId())
                    .pageIndex(page.getPageIndex())
                    .width(page.getWidth())
                    .height(page.getHeight())
                    .isLocked(page.isLocked())
                    .canViewClear(hasAccess)
                    .imageUrl("/api/pages/" + page.getId() + "/image") // Endpoint lấy ảnh
                    .build();
        }).collect(Collectors.toList());
    }

    // --- 2. STREAM ẢNH (Decrypt on-the-fly) ---
    public InputStream getPageImageStream(String pageId, String userId) throws Exception {
        // 1. Lấy thông tin Page
        FilePage page = filePageRepository.findById(pageId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 2. Lấy thông tin File Gốc
        FileNode file = fileNodeRepository.findById(page.getFileId())
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        // 3. Check quyền (như cũ)
        boolean isOwner = file.getOwnerId().equals(userId);
        boolean canViewClear = checkPageAccess(page, userId, isOwner);

        // 4. Xác định Metadata cần dùng (Clear hay Blur)
        String targetGridFsId;
        FileNode.EncryptionMetadata pageEncData;

        if (canViewClear) {
            targetGridFsId = page.getClearGridFsId();
            pageEncData = page.getClearEncryptionData();
        } else {
            targetGridFsId = page.getBlurredGridFsId();
            pageEncData = page.getBlurredEncryptionData();
        }

        // 5. [QUAN TRỌNG] LẤY KEY TỪ FILE GỐC
        // Vì pageEncData.getKeyId() là null, nên ta phải lấy KeyId từ FileNode gốc
        String rootKeyId = file.getEncryptionMetadata().getKeyId();

        FileKey fileKeyEntity = fileKeyRepository.findById(rootKeyId)
                .orElseThrow(() -> new AppException(AppErrorCode.KEY_NOT_FOUND));

        // Giải mã Master Key -> Lấy được Raw Key dùng chung
        SecretKey sharedKey = cryptoUtils.decryptFileKey(fileKeyEntity.getEncryptedKey());

        // 6. Lấy IV riêng của trang (từ pageEncData)
        byte[] pageIv = cryptoUtils.decodeBase64(pageEncData.getIv());

        // 7. Decrypt Stream
        InputStream rawStream = coreFileService.loadRawFileStream(targetGridFsId);
        Cipher decryptCipher = cryptoUtils.getDecryptCipher(sharedKey, pageIv);

        return new CipherInputStream(rawStream, decryptCipher);
    }

    // --- 3. HELPER: CHECK QUYỀN ---
    private boolean checkPageAccess(FilePage page, String userId, boolean isOwner) {
        // 1. Nếu là chủ sở hữu -> Full quyền
        if (isOwner) return true;

        // 2. Nếu trang không khoá -> Ai xem được file gốc thì xem được trang này
        if (!page.isLocked()) return true;

        // 3. Nếu trang bị khoá -> Check bảng UserPageAccess
        return userPageAccessRepository.existsByUserIdAndFileIdAndPageIndex(
                userId, page.getFileId(), page.getPageIndex()
        );
    }

    // --- 4. TOGGLE LOCK (Cho Owner) ---
    public boolean togglePageLock(String pageId, String userId) {
        FilePage page = filePageRepository.findById(pageId)
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        FileNode file = fileNodeRepository.findById(page.getFileId())
                .orElseThrow(() -> new AppException(AppErrorCode.FILE_NOT_FOUND));

        if (!file.getOwnerId().equals(userId)) {
            throw new AppException(AppErrorCode.UNAUTHORIZED);
        }

        page.setLocked(!page.isLocked());
        filePageRepository.save(page);
        return page.isLocked();
    }

    public List<GrantedAccessDto> getGrantedAccessList(String fileId) {
        // 1. Lấy tất cả bản ghi quyền
        List<UserPageAccess> accessList = userPageAccessRepository.findByFileId(fileId);

        // 2. Map sang DTO và lấy thông tin User
        return accessList.stream().map(access -> {
            // Giả sử userService.getUserById(id) trả về UserInfoResponse
            // Nếu muốn tối ưu, hãy dùng Set<UserId> để fetch 1 lần (batch fetch) thay vì gọi loop.
            // Ở đây viết đơn giản để dễ hiểu:
            UserInfoResponse user = userService.getUserById(access.getUserId());

            return GrantedAccessDto.builder()
                    .id(access.getId())
                    .userId(access.getUserId())
                    .userEmail(user != null ? user.getEmail() : "Unknown")
                    .userFullName(user != null ? user.getFullName() : "Unknown")
                    .userAvatar(user != null ? user.getAvatarUrl() : null)
                    .fileId(access.getFileId())
                    .pageIndex(access.getPageIndex())
                    .grantedAt(access.getGrantedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    public void revokeAccess(String userId, String fileId, int pageIndex) {
        userPageAccessRepository.deleteByUserIdAndFileIdAndPageIndex(userId, fileId, pageIndex);
    }
}