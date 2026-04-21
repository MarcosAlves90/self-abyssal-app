package com.abyssal.catalog.config;

import com.abyssal.shared.security.JwtService;
import com.abyssal.shared.security.SecurityProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({SecurityProperties.class, SeedProperties.class})
public class SecurityConfig {
  @Bean
  public JwtService jwtService(SecurityProperties properties) {
    return new JwtService(properties);
  }
}
