package com.securedoc.backend.client;

import feign.Headers;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

// Cấu hình để hỗ trợ upload file qua Feign
@FeignClient(name = "whisper-client", url = "${app.whisper-url:http://whisper:8000}")
public interface WhisperClient {

    @PostMapping(value = "/v1/audio/transcriptions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Headers("Content-Type: multipart/form-data")
    WhisperResponse transcribe(
            @RequestPart("file") MultipartFile file,
            @RequestPart("model") String model,      // vd: "small"
            @RequestPart("language") String language // vd: "vi"
    );

    @Data
    class WhisperResponse {
        private String text; // Nội dung đã dịch ra chữ
    }
}