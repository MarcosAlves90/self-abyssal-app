package com.abyssal.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class HttpsEnforcementFilter extends OncePerRequestFilter {
  private final SecurityProperties properties;
  private final ObjectMapper objectMapper;

  public HttpsEnforcementFilter(SecurityProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    if (!properties.isRequireHttpsInProduction()) {
      filterChain.doFilter(request, response);
      return;
    }

    String forwardedProto = request.getHeader("X-Forwarded-Proto");

    if (request.isSecure() || StringUtils.hasText(forwardedProto) && "https".equalsIgnoreCase(forwardedProto)) {
      filterChain.doFilter(request, response);
      return;
    }

    SecurityJsonWriter.write(response, objectMapper, HttpStatus.UPGRADE_REQUIRED, "HTTPS is required.");
  }
}
