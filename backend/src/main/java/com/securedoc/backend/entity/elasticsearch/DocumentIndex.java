package com.securedoc.backend.entity.elasticsearch;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Data
@Builder
@Document(indexName = "documents")
public class DocumentIndex {
    @Id
    private String id;

    // SỬA: Đổi title -> name để khớp với FileNode và DTO
    @Field(type = FieldType.Text, analyzer = "vi_analyzer", searchAnalyzer = "vi_analyzer")
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Text, analyzer = "vi_analyzer", searchAnalyzer = "vi_analyzer")
    private String content;

    @Field(type = FieldType.Keyword)
    private String type; // FILE/FOLDER

    @Field(type = FieldType.Keyword)
    private String extension;

    // THÊM MỚI: Kích thước file
    @Field(type = FieldType.Long)
    private Long size;

    // THÊM MỚI: MimeType (để hiển thị icon chính xác)
    @Field(type = FieldType.Keyword)
    private String mimeType;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Boolean)
    private boolean isDeleted;

    @Field(type = FieldType.Keyword)
    private String ownerId;

    @Field(type = FieldType.Keyword)
    private List<String> allowedUsers;

    @Field(type = FieldType.Date)
    private String createdAt;

    @Field(type = FieldType.Date)
    private String updatedAt;

    @Field(type = FieldType.Keyword)
    private List<String> ancestors;
}