package com.securedoc.backend.service;

import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.SearchFileRequest;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

// --- IMPORT CHUẨN (Quan trọng) ---
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.RangeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.DateRangeQuery; // Import cái này
// --------------------------------

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final ModelMapper modelMapper;
    private final RecentFileService recentFileService;

    public List<FileResponse> searchFiles(SearchFileRequest request, String userId) {

        List<String> recentFileIds = recentFileService.getRecentFileIds(userId);

        NativeQuery query = NativeQuery.builder()
                .withQuery(q -> q.bool(b -> {

                    // 1. KEYWORD
                    if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                        b.must(m -> m.bool(b2 -> b2
                                .should(s -> s.match(mat -> mat.field("title").query(request.getKeyword()).boost(2.0f)))
                                .should(s -> s.match(mat -> mat.field("content").query(request.getKeyword())))
                        ));
                    }

                    // 2. FILTER CƠ BẢN
                    b.filter(f -> f.term(t -> t.field("status").value("AVAILABLE")));

                    boolean isInTrash = request.getInTrash() != null && request.getInTrash();
                    b.filter(f -> f.term(t -> t.field("isDeleted").value(isInTrash)));

                    if (request.getFileType() != null && !request.getFileType().isBlank()) {
                        if (request.getFileType().equalsIgnoreCase("FOLDER")) {
                            b.filter(f -> f.term(t -> t.field("type").value("FOLDER")));
                        } else {
                            b.filter(f -> f.term(t -> t.field("extension").value(request.getFileType().toLowerCase())));
                        }
                    }

                    if (request.getOwnerId() != null && !request.getOwnerId().isBlank()) {
                        b.filter(f -> f.term(t -> t.field("ownerId").value(request.getOwnerId())));
                    }

                    if (request.getLocationId() != null && !request.getLocationId().isBlank()) {
                        b.filter(f -> f.term(t -> t.field("ancestors").value(request.getLocationId())));
                    }

                    // =========================================================
                    // 3. LỌC NGÀY SỬA ĐỔI (FIXED: Dùng DateRangeQuery)
                    // =========================================================
                    if (request.getFromDate() != null || request.getToDate() != null) {

                        // Bước A: Tạo Builder cho DATE Range (Đây mới là nơi có field, gte, lte)
                        DateRangeQuery.Builder dateRangeBuilder = new DateRangeQuery.Builder();
                        dateRangeBuilder.field("updatedAt"); // Tên trường

                        if (request.getFromDate() != null) {
                            String fromTime = request.getFromDate().atStartOfDay().format(DateTimeFormatter.ISO_DATE_TIME);
                            dateRangeBuilder.gte(fromTime); // DateRangeQuery nhận String trực tiếp, không cần JsonData
                        }

                        if (request.getToDate() != null) {
                            String toTime = request.getToDate().atTime(23, 59, 59).format(DateTimeFormatter.ISO_DATE_TIME);
                            dateRangeBuilder.lte(toTime);
                        }

                        // Bước B: Bọc DateRangeQuery vào RangeQuery (Cái vỏ)
                        RangeQuery.Builder rangeQueryBuilder = new RangeQuery.Builder();
                        rangeQueryBuilder.date(dateRangeBuilder.build());

                        // Bước C: Đóng gói vào Query chung và Filter
                        Query dateQuery = Query.of(qi -> qi.range(rangeQueryBuilder.build()));
                        b.filter(dateQuery);
                    }
                    // =========================================================

                    // 4. SECURITY FILTER
                    b.filter(f -> f.bool(securityBool -> {
                        securityBool.should(s -> s.term(t -> t.field("allowedUsers").value(userId)));
                        if (!recentFileIds.isEmpty()) {
                            securityBool.should(s -> s.ids(i -> i.values(recentFileIds)));
                        }
                        return securityBool;
                    }));

                    return b;
                }))
                .withSort(Sort.by(Sort.Direction.DESC, "_score"))
                .withPageable(PageRequest.of(request.getPage(), request.getSize()))
                .build();

        SearchHits<DocumentIndex> searchHits = elasticsearchOperations.search(query, DocumentIndex.class);

        return searchHits.stream()
                .map(SearchHit::getContent)
                .map(doc -> modelMapper.map(doc, FileResponse.class))
                .collect(Collectors.toList());
    }
}