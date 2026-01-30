package com.securedoc.backend.client;

import feign.Headers;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "tika-client", url = "${app.tika-url:http://tika:9998}")
public interface TikaClient {

    // 1. Trích xuất Text + Metadata
    @PutMapping(value = "/tika/text", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Headers({
            "Accept: text/plain",             // Yêu cầu trả về text
            "X-Tika-OCR-Language: vie+eng",   // Ưu tiên tiếng Việt, dự phòng tiếng Anh
            "X-Tika-OCR-Enable: true",        // Bắt buộc bật OCR
            "X-Tika-PDFextractInlineImages: true" // (Optional) Nếu muốn OCR cả ảnh trong PDF sau này
    })
    String parseToString(@RequestBody byte[] fileData);

    // 2. [MỚI] Phát hiện loại file (MimeType) chuẩn xác
    // Tika Server endpoint: /detect/stream
    @PutMapping(value = "/detect/stream", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    String detectMimeType(@RequestBody byte[] fileData);
}