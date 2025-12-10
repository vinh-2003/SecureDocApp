package com.securedoc.backend.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {

        log.error("Unauthorized error: {}", authException.getMessage());

        // 1. Set trạng thái HTTP 401
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 2. Tạo body phản hồi khớp với cấu trúc ApiResponse mà ta đã thống nhất
        final Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Truy cập bị từ chối: Vui lòng đăng nhập (Unauthorized)");
        // Mã lỗi 401 (hoặc dùng Enum AppErrorCode nếu muốn chi tiết hơn)
        body.put("errorCode", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("data", null);

        // Thêm chi tiết lỗi (Tùy chọn, tốt cho debug dev, production nên ẩn)
        body.put("errorDetails", authException.getMessage());

        // 3. Ghi JSON vào luồng phản hồi
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}