package com.securedoc.backend.service;

import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.SearchFileRequest;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.repository.FileNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightParameters;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
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
    private final RecentFileService recentFileService;

    private final FileNodeRepository fileNodeRepository;
    private final FileStorageService fileStorageService;

    private final Highlight highlightConfig = new Highlight(
            HighlightParameters.builder()
                    .withPreTags("<mark class='highlight'>") // Thẻ mở tô đậm (có thể chỉnh CSS FE)
                    .withPostTags("</mark>")                 // Thẻ đóng
                    .withFragmentSize(150)                   // Độ dài đoạn trích dẫn (ký tự)
                    .withNumberOfFragments(1)                // Chỉ lấy 1 đoạn tiêu biểu nhất
                    .build(),
            Collections.singletonList(new HighlightField("content"))
    );

    public List<FileResponse> searchFiles(SearchFileRequest request, String userId) {

        List<String> recentFileIds = recentFileService.getRecentFileIds(userId);

        NativeQuery query = NativeQuery.builder()
                .withQuery(q -> q.bool(b -> {

                    // 1. KEYWORD
                    if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                        b.must(m -> m.bool(b2 -> b2
                                .should(s -> s.match(mat -> mat
                                        .field("name")
                                        .query(request.getKeyword())
                                        .boost(2.0f)
                                ))
                                .should(s -> s.match(mat -> mat
                                        .field("content")
                                        .query(request.getKeyword())
                                        .fuzziness("AUTO")
                                ))
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
                .withHighlightQuery(new HighlightQuery(highlightConfig, DocumentIndex.class))
                .build();

        SearchHits<DocumentIndex> searchHits = elasticsearchOperations.search(query, DocumentIndex.class);

        if (!searchHits.hasSearchHits()) {
            return Collections.emptyList();
        }

        // [TỐI ƯU] 3. Xử lý Map Highlight đơn giản hơn (Chỉ lấy Content)
        Map<String, String> highlightMap = new HashMap<>();
        List<String> elasticIds = new ArrayList<>();

        searchHits.forEach(hit -> {
            String docId = hit.getContent().getId();
            elasticIds.add(docId);

            // Chỉ lấy highlight của content
            List<String> contentHighlights = hit.getHighlightField("content");
            if (contentHighlights != null && !contentHighlights.isEmpty()) {
                highlightMap.put(docId, contentHighlights.get(0));
            }
        });

        // 4. FETCH DB (Giữ nguyên)
        List<FileNode> dbNodes = fileNodeRepository.findAllById(elasticIds);
        Map<String, FileNode> nodeMap = dbNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, Function.identity()));

        // 5. MAP RESPONSE (Giữ nguyên)
        return elasticIds.stream()
                .map(nodeMap::get)
                .filter(Objects::nonNull)
                .map(node -> {
                    FileResponse res = fileStorageService.convertToResponse(node, userId);
                    // Inject Highlight
                    res.setHighlightedContent(highlightMap.get(node.getId()));
                    return res;
                })
                .collect(Collectors.toList());
    }
}