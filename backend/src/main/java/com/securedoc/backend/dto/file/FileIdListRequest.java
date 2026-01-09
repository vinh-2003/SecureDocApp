package com.securedoc.backend.dto.file;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class FileIdListRequest {
    @NotEmpty(message = "Danh sách ID không được để trống")
    private List<String> ids;
}