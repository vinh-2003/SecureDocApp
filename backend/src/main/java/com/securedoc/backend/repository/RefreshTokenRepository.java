package com.securedoc.backend.repository;

import com.securedoc.backend.entity.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    // Sửa thành deleteByUserId để khớp với field "userId" trong Entity
    // Kiểu trả về là void (hoặc long nếu muốn đếm số lượng xóa)
    void deleteByUserId(String userId);
}