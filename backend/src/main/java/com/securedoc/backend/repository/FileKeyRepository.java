package com.securedoc.backend.repository;

import com.securedoc.backend.entity.FileKey;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FileKeyRepository extends MongoRepository<FileKey, String> {
    // Tìm key theo ID của FileNode
    Optional<FileKey> findByFileNodeId(String fileNodeId);
}