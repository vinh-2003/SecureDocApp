package com.securedoc.backend.entity.elasticsearch;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Data
@Builder
@Document(indexName = "file_pages") // Index riêng biệt
public class PageIndex {
    @Id
    private String id; // Trùng với ID của FilePage bên Mongo

    @Field(type = FieldType.Keyword)
    private String fileId; // Link về file gốc

    @Field(type = FieldType.Integer)
    private int pageIndex;

    // Nội dung text của trang này (Quan trọng nhất)
    @Field(type = FieldType.Text, analyzer = "vi_analyzer", searchAnalyzer = "vi_analyzer")
    private String content;

    // --- CÁC TRƯỜNG COPY TỪ FILE GỐC (ĐỂ CHECK QUYỀN KHI SEARCH) ---

    @Field(type = FieldType.Keyword)
    private String ownerId;

    @Field(type = FieldType.Keyword)
    private List<String> ancestors; // Để check quyền theo thư mục cha

    @Field(type = FieldType.Keyword)
    private List<String> allowedUsers; // Nếu có logic share riêng lẻ

    @Field(type = FieldType.Text)
    private String fileName; // Lưu tên file để hiển thị nhanh kết quả tìm kiếm
}