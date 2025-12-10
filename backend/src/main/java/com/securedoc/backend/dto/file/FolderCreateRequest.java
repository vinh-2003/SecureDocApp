package com.securedoc.backend.dto.file;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FolderCreateRequest {

    @NotBlank(message = "Tên thư mục không được để trống")
    @Size(max = 255, message = "Tên thư mục quá dài (tối đa 255 ký tự)")
    @Pattern(regexp = "^[^<>:\"/\\\\|?*]*$", message = "Tên thư mục chứa ký tự không hợp lệ")
    private String name;

    // parentId có thể null (nếu tạo ở thư mục gốc)
    private String parentId;
}