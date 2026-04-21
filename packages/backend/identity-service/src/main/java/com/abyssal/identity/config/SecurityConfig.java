package com.abyssal.identity.config;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

import com.abyssal.shared.crypto.HashingService;
import com.abyssal.shared.crypto.TextCrypto;
import com.abyssal.shared.security.HttpsEnforcementFilter;
import com.abyssal.shared.security.JsonAccessDeniedHandler;
import com.abyssal.shared.security.JsonAuthenticationEntryPoint;
import com.abyssal.shared.security.JwtAuthenticationFilter;
import com.abyssal.shared.security.JwtService;
import com.abyssal.shared.security.SecurityProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableConfigurationProperties({SecurityProperties.class, SeedProperties.class})
public class SecurityConfig {
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  public HashingService hashingService() {
    return new HashingService();
  }

  @Bean
  public TextCrypto textCrypto(SecurityProperties properties) {
    return new TextCrypto(properties);
  }

  @Bean
  public JwtService jwtService(SecurityProperties properties) {
    return new JwtService(properties);
  }

  @Bean
  public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
    return new JwtAuthenticationFilter(jwtService, objectMapper);
  }

  @Bean
  public HttpsEnforcementFilter httpsEnforcementFilter(
    SecurityProperties properties,
    ObjectMapper objectMapper
  ) {
    return new HttpsEnforcementFilter(properties, objectMapper);
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
    HttpSecurity http,
    ObjectMapper objectMapper,
    JwtAuthenticationFilter jwtAuthenticationFilter,
    HttpsEnforcementFilter httpsEnforcementFilter
  ) throws Exception {
    return http
      .csrf(AbstractHttpConfigurer::disable)
      .cors(Customizer.withDefaults())
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .exceptionHandling(exceptionHandling -> exceptionHandling
        .authenticationEntryPoint(new JsonAuthenticationEntryPoint(objectMapper))
        .accessDeniedHandler(new JsonAccessDeniedHandler(objectMapper))
      )
      .authorizeHttpRequests(authorize -> authorize
        .requestMatchers(antMatcher("/actuator/health")).permitAll()
        .requestMatchers(antMatcher("/api/auth/register"), antMatcher("/api/auth/login")).permitAll()
        .anyRequest().authenticated()
      )
      .addFilterBefore(httpsEnforcementFilter, AuthorizationFilter.class)
      .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }
}
