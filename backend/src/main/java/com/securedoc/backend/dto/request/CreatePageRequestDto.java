package com.securedoc.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePageRequestDto {

    @NotBlank(message = "ID tài liệu không được để trống")
    private String fileId;

    @NotEmpty(message = "Danh sách trang yêu cầu không được để trống")
    private List<Integer> pageIndexes; // VD: [1, 5, 12]

    @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự")
    private String reason;
}