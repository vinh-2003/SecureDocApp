package com.securedoc.backend.dto.file;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FileDescriptionRequest {
    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String description;
}