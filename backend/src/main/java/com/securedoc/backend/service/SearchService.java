package com.securedoc.backend.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.DateRangeQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.RangeQuery;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.securedoc.backend.client.ClipClient;
import com.securedoc.backend.dto.file.FileResponse;
import com.securedoc.backend.dto.file.SearchFileRequest;
import com.securedoc.backend.entity.FileNode;
import com.securedoc.backend.entity.elasticsearch.DocumentIndex;
import com.securedoc.backend.repository.FileNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final ElasticsearchClient elasticsearchClient;
    private final RecentFileService recentFileService;
    private final FileNodeRepository fileNodeRepository;
    private final FileStorageService fileStorageService;
    private final ClipClient clipClient;

    private final Highlight highlightConfig = new Highlight(
            HighlightParameters.builder()
                    .withPreTags("<mark class='highlight'>")
                    .withPostTags("</mark>")
                    .withFragmentSize(150)
                    .withNumberOfFragments(1)
                    .build(),
            Collections.singletonList(new HighlightField("content"))
    );

    /**
     * API 0: Tìm kiếm từ khóa (Keyword)
     */
    public List<FileResponse> searchFiles(SearchFileRequest request, String userId) {
        NativeQuery query = NativeQuery.builder()
                .withQuery(q -> q.bool(b -> {
                    // 1. Keyword
                    if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                        b.must(m -> m.bool(b2 -> b2
                                .should(s -> s.match(mat -> mat.field("name").query(request.getKeyword()).boost(2.0f)))
                                .should(s -> s.match(mat -> mat.field("content").query(request.getKeyword()).fuzziness("AUTO")))
                        ));
                    }
                    // 2. Common Filters (Bao gồm Owner Filter & Security Filter)
                    applyCommonFilters(b, request, userId);
                    return b;
                }))
                .withSort(Sort.by(Sort.Direction.DESC, "_score"))
                .withPageable(PageRequest.of(request.getPage(), request.getSize()))
                .withHighlightQuery(new HighlightQuery(highlightConfig, DocumentIndex.class))
                .build();

        return executeSearchAndMapResponse(query, userId);
    }

    /**
     * API 1: Tìm kiếm ngữ nghĩa (Text -> Vector)
     */
    public List<FileResponse> searchBySemantics(String textQuery, int limit, String userId) {
        try {
            ClipClient.JinaInput input = ClipClient.JinaInput.builder()
                    .text(textQuery)
                    .build();

            ClipClient.JinaRequest req = ClipClient.JinaRequest.builder()
                    .data(List.of(input))
                    .build();

            float[] vector = clipClient.embed(req).getData().get(0).getEmbedding();
            return searchByVector(vector, limit, userId);
        } catch (Exception e) {
            log.error("Semantic search failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * API 2: Tìm kiếm hình ảnh (Image -> Vector)
     */
    public List<FileResponse> searchByImage(MultipartFile imageFile, int limit, String userId) {
        try {
            byte[] fileBytes = imageFile.getBytes();

            String base64Img = Base64.getEncoder().encodeToString(fileBytes);
            String imageUrl = "data:image/png;base64," + base64Img;

            ClipClient.JinaInput input = ClipClient.JinaInput.builder()
                    .uri(imageUrl)
                    .build();

            ClipClient.JinaRequest req = ClipClient.JinaRequest.builder()
                    .data(List.of(input))
                    .build();

            float[] vector = clipClient.embed(req).getData().get(0).getEmbedding();
            return searchByVector(vector, limit, userId);
        } catch (Exception e) {
            log.error("Image search failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private List<FileResponse> searchByVector(float[] vector, int limit, String userId) {
        SearchFileRequest defaultReq = new SearchFileRequest();
        defaultReq.setInTrash(false);

        try {
            // [QUAN TRỌNG] Dùng Void.class vì ta không cần đọc body JSON
            SearchResponse<Void> response = elasticsearchClient.search(s -> s
                            .index("documents")
                            .knn(k -> k
                                    .field("imageVector")
                                    .queryVector(convertToFloatList(vector))
                                    .k(limit)
                                    .numCandidates(100)
                                    .filter(f -> f.bool(b -> {
                                        applyCommonFilters(b, defaultReq, userId);
                                        return b;
                                    }))
                            )
                            .size(limit)
                            .minScore(0.6d)
                            .source(src -> src.fetch(false)), // [FIX] Tắt lấy source -> Fix lỗi Decode + Tăng tốc
                    Void.class // [FIX] Không map vào Entity
            );

            return mapElasticClientResponse(response, userId);

        } catch (IOException e) {
            log.error("Vector search IO error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Helper: Map từ SearchResponse (Low-level) sang FileResponse
     */
    private List<FileResponse> mapElasticClientResponse(SearchResponse<Void> response, String userId) {
        if (response.hits().hits().isEmpty()) {
            return Collections.emptyList();
        }

        List<String> elasticIds = new ArrayList<>();

        // [FIX] Lấy ID trực tiếp từ Metadata của Hit (không cần parse source)
        for (Hit<Void> hit : response.hits().hits()) {
            if (hit.id() != null) {
                elasticIds.add(hit.id());
            }
        }

        // Fetch dữ liệu từ MongoDB
        List<FileNode> dbNodes = fileNodeRepository.findAllById(elasticIds);
        Map<String, FileNode> nodeMap = dbNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, Function.identity()));

        // Map sang DTO và giữ thứ tự score
        return elasticIds.stream()
                .map(nodeMap::get)
                .filter(Objects::nonNull)
                .map(node -> fileStorageService.convertToResponse(node, userId))
                .collect(Collectors.toList());
    }

    /**
     * LOGIC LỌC DÙNG CHUNG
     * userId: Người đang thực hiện search (để check quyền)
     * request.ownerId: Người sở hữu file cần tìm (để filter)
     */
    private void applyCommonFilters(BoolQuery.Builder b, SearchFileRequest request, String userId) {
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
        List<String> recentFileIds = recentFileService.getRecentFileIds(userId);
        // 4. SECURITY FILTER
        b.filter(f -> f.bool(securityBool -> {
            securityBool.should(s -> s.term(t -> t.field("allowedUsers").value(userId)));
            if (!recentFileIds.isEmpty()) {
                securityBool.should(s -> s.ids(i -> i.values(recentFileIds)));
            }
            return securityBool;
        }));
    }

    private List<FileResponse> executeSearchAndMapResponse(NativeQuery query, String userId) {
        SearchHits<DocumentIndex> searchHits = elasticsearchOperations.search(query, DocumentIndex.class);

        if (!searchHits.hasSearchHits()) {
            return Collections.emptyList();
        }

        Map<String, String> highlightMap = new HashMap<>();
        List<String> elasticIds = new ArrayList<>();

        searchHits.forEach(hit -> {
            String docId = hit.getContent().getId();
            elasticIds.add(docId);
            List<String> contentHighlights = hit.getHighlightField("content");
            if (contentHighlights != null && !contentHighlights.isEmpty()) {
                highlightMap.put(docId, contentHighlights.get(0));
            }
        });

        List<FileNode> dbNodes = fileNodeRepository.findAllById(elasticIds);
        Map<String, FileNode> nodeMap = dbNodes.stream()
                .collect(Collectors.toMap(FileNode::getId, Function.identity()));

        return elasticIds.stream()
                .map(nodeMap::get)
                .filter(Objects::nonNull)
                .map(node -> {
                    FileResponse res = fileStorageService.convertToResponse(node, userId);
                    res.setHighlightedContent(highlightMap.get(node.getId()));
                    return res;
                })
                .collect(Collectors.toList());
    }

    private List<Float> convertToFloatList(float[] array) {
        if (array == null) return Collections.emptyList();
        List<Float> list = new ArrayList<>(array.length);
        for (float v : array) list.add(v);
        return list;
    }
}