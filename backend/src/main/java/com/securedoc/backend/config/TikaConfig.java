package com.securedoc.backend.config;

import org.apache.tika.Tika;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TikaConfig {
    @Bean
    public Tika tika() {
        // Tika tự động nhận diện loại file và bóc tách text
        return new Tika();
    }
}