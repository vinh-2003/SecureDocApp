package com.securedoc.backend.repository;

import com.securedoc.backend.entity.User;
import com.securedoc.backend.entity.VerificationToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {
    Optional<VerificationToken> findByToken(String token);
    void deleteByUser(User user); // Xóa token cũ của user nếu có
    void deleteByUserAndType(User user, VerificationToken.TokenType type);
}