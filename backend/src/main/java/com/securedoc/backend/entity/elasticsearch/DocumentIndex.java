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

    @Field(type = FieldType.Text, analyzer = "vi_analyzer", searchAnalyzer = "vi_analyzer")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Text, analyzer = "vi_analyzer", searchAnalyzer = "vi_analyzer")
    private String content;

    @Field(type = FieldType.Keyword)
    private String type; // FILE/FOLDER

    @Field(type = FieldType.Keyword)
    private String extension; // pdf, docx...

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Boolean)
    private boolean isDeleted; // Phục vụ lọc Thùng rác

    // --- BẢO MẬT ---
    @Field(type = FieldType.Keyword)
    private String ownerId;

    @Field(type = FieldType.Keyword)
    private List<String> allowedUsers;

    // --- THỜI GIAN ---
    // Lưu dưới dạng String ISO-8601 (yyyy-MM-ddTHH:mm:ss) để dễ range query
    @Field(type = FieldType.Date)
    private String createdAt;

    @Field(type = FieldType.Date)
    private String updatedAt; // <-- THÊM MỚI

    // --- VỊ TRÍ ---
    @Field(type = FieldType.Keyword)
    private List<String> ancestors; // Để lọc theo folder cha (Location)
}