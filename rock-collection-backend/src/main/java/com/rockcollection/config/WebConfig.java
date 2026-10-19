// WebConfig.java - CORS: only the app's own frontend may call the API from a browser
package com.rockcollection.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The API holds private data (prices, sellers, notes) and has no login, so other web sites must not be able to
 * read it or change it through the owner's browser. Only the origins in {@code rockcollection.cors.allowed-origins}
 * (the frontend's address) are allowed; see also {@link AppHeaderFilter}.
 */
@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer(@Value("${rockcollection.cors.allowed-origins}") String[] allowedOrigins) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", AppHeaderFilter.HEADER);
            }
        };
    }
}
