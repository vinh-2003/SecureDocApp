package com.securedoc.backend.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "clip-client", url = "${app.clip-url:http://localhost:51000}")
public interface ClipClient {

    // Jina sử dụng endpoint /post
    @PostMapping("/post")
    JinaResponse embed(@RequestBody JinaRequest request);

    // --- DTO REQUEST (Chuẩn Jina) ---
    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    class JinaRequest {
        private List<JinaInput> data;
        // Tham số phụ nếu cần (VD: trancate, vv)
        private Map<String, Object> parameters;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    class JinaInput {
        // Dùng field này nếu là Text
        private String text;

        // Dùng field này nếu là Ảnh (Base64 URI: "data:image/png;base64,...")
        private String uri;
    }

    // --- DTO RESPONSE (Chuẩn Jina) ---
    @Data @NoArgsConstructor
    class JinaResponse {
        private List<JinaResult> data;
    }

    @Data @NoArgsConstructor
    class JinaResult {
        private float[] embedding; // Vector kết quả
        private String text;
        private String uri;
    }
}