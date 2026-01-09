package com.securedoc.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum AppErrorCode {
    // --- 1xxx: Lỗi User & Auth ---
    USER_NOT_FOUND(1001, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_EXISTED(1002, "Username đã tồn tại", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1003, "Email đã tồn tại", HttpStatus.BAD_REQUEST),

    // 401 Unauthorized: Chưa đăng nhập hoặc sai pass
    INVALID_CREDENTIALS(1004, "Username hoặc Password không đúng", HttpStatus.UNAUTHORIZED),

    // Cập nhật thông báo rõ ràng hơn
    ACCOUNT_LOCKED(1005, "Tài khoản đã bị khóa do nhập sai quá số lần quy định. Vui lòng thử lại sau.", HttpStatus.FORBIDDEN),

    UNAUTHENTICATED(1006, "Vui lòng đăng nhập", HttpStatus.UNAUTHORIZED),

    // --- MỚI THÊM: Token & Active ---
    ACCOUNT_NOT_ENABLED(1007, "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email xác thực.", HttpStatus.FORBIDDEN),

    INVALID_TOKEN(1008, "Mã xác thực không hợp lệ hoặc không tồn tại.", HttpStatus.BAD_REQUEST),

    TOKEN_EXPIRED(1009, "Link xác thực đã hết hạn. Vui lòng yêu cầu gửi lại.", HttpStatus.BAD_REQUEST),

    EMAIL_SEND_FAILURE(1010, "Gửi email thất bại. Vui lòng liên hệ quản trị viên.", HttpStatus.INTERNAL_SERVER_ERROR),

    INVALID_PASSWORD(1011, "Mật khẩu không hợp lệ.", HttpStatus.BAD_REQUEST),

    UNAUTHORIZED(1012, "Bạn không có quyền truy cập", HttpStatus.FORBIDDEN),
    ROLE_NOT_FOUND(1013, "Không tìm thấy vai trò", HttpStatus.NOT_FOUND),
    KEY_NOT_FOUND(1014, "Không tìm thấy chìa khoá mở tài liệu", HttpStatus.NOT_FOUND),




    // --- 2xxx: Lỗi File/Folder ---
    FILE_NOT_FOUND(2001, "Không tìm thấy tài liệu hoặc thư mục", HttpStatus.NOT_FOUND),

    // 403 Forbidden: Đã đăng nhập nhưng không có quyền
    FILE_ACCESS_DENIED(2002, "Bạn không có quyền truy cập tài liệu này", HttpStatus.FORBIDDEN),

    FOLDER_NAME_EXISTED(2003, "Tên thư mục đã tồn tại", HttpStatus.BAD_REQUEST),
    PARENT_NOT_FOUND(2004, "Thư mục cha không tồn tại", HttpStatus.NOT_FOUND),
    PARENT_IS_NOT_FOLDER(2005, "Node cha không phải là thư mục", HttpStatus.BAD_REQUEST),
    FILE_EXTENSION_NOT_SUPPORTED(2006, "Định dạng file không hỗ trợ", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(2007, "Dung lượng file vượt quá giới hạn cho phép (10MB)", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_NAME_EXISTED(2008, "Tên thư tệp đã tồn tại", HttpStatus.BAD_REQUEST),
    SHARE_FOR_OWNER(2009, "Vui lòng nhập email khác với email của chủ sở hữu vì họ đã có toàn quyền với tài liệu này", HttpStatus.BAD_REQUEST),
    OWNER_CREATE_REQUEST(2010, "Bạn là chủ sở hữu, không cần gửi yêu cầu.", HttpStatus.BAD_REQUEST),
    INVALID_RENAME_FOLDER_REQUEST(2011, "Đây không phải thư mục.", HttpStatus.BAD_REQUEST),
    INVALID_RENAME_FILE_REQUEST(2012, "Đây không phải tệp.", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(2013, "Không tìm thấy yêu cầu.", HttpStatus.NOT_FOUND),
    REQUEST_HANDLED(2014, "Yêu cầu này đã được xử lý trước đó.", HttpStatus.BAD_REQUEST),
    FORBIDDEN(2015, "Bạn cần được cấp quyền xem toàn bộ các trang bị khóa để tải tài liệu này.", HttpStatus.FORBIDDEN),
    INVALID_FILE_FORMAT(2016, "Định dạng không hợp lệ", HttpStatus.BAD_REQUEST),
    FORBIDDEN_DOWNLOAD_OR_COPY_LOCKED(2017, "Bạn cần mở khoá toàn bộ các trang để tải xuống hoặc tạo bản sao cho tệp tin này.", HttpStatus.BAD_REQUEST),
    DOWNLOAD_FOLDER(2018, "Không thể tải xuống một thư mục", HttpStatus.BAD_REQUEST),
    COPY_FOLDER(2019, "Chỉ hỗ trợ copy file.", HttpStatus.BAD_REQUEST),
    CANNOT_REVOKE_OWNER(2020, "Không thể xoá quyền chủ sở hữu.", HttpStatus.BAD_REQUEST),
    CANNOT_REVOKE_SUPERIOR(2021, "Không thể thu hồi quyền của người có cấp bậc cao hơn trong hệ thống phân cấp.", HttpStatus.BAD_REQUEST),
    CANNOT_REVOKE_IN_SCOPE(2022, "Không thể xoá quyền vì bạn không có quyền trong toàn bộ phạm vi của quyền này.", HttpStatus.BAD_REQUEST),
    CANNOT_SHARE_IN_SCOPE(2023, "Không thể chia sẻ quyền vì bạn không có quyền trong toàn bộ phạm vi của quyền này.", HttpStatus.BAD_REQUEST),
    CANNOT_CHANGE_IN_SCOPE(2024, "Không thể thay đổi quyền vì bạn không có quyền trong toàn bộ phạm vi của quyền này.", HttpStatus.BAD_REQUEST),
    NOT_ENOUGH_PERMISSION(2025, "Bạn không đủ thẩm quyền để thay đổi quyền truy cập của người này (Cấp bậc cao hơn bạn).", HttpStatus.BAD_REQUEST),
    INVALID_UPLOAD_BATCH_REQUEST(2026, "Số lượng file và đường dẫn không khớp.", HttpStatus.BAD_REQUEST),
    READ_DOCX_FILE(2027, "Lỗi đọc dữ liệu file DOCX", HttpStatus.BAD_REQUEST),
    FOLDER_NOT_FOUND(2028, "Thư mục không tồn tại", HttpStatus.NOT_FOUND),



    // --- 9xxx: Lỗi Hệ thống ---
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa xác định", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    AppErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}