package com.securedoc.backend.dto.request;

import java.time.LocalDateTime;
import java.util.List;

import com.securedoc.backend.enums.EActivityType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityFilterRequest {

    // Filter theo loại hành động (null = tất cả)
    private List<EActivityType> actionTypes;

    // Filter theo người thực hiện (null = tất cả)
    private String actorId;

    // Filter theo thời gian
    private LocalDateTime fromDate;
    private LocalDateTime toDate;

    // Pagination
    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;
}
