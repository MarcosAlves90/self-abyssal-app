package com.abyssal.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtService jwtService;
  private final ObjectMapper objectMapper;

  public JwtAuthenticationFilter(JwtService jwtService, ObjectMapper objectMapper) {
    this.jwtService = jwtService;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (!StringUtils.hasText(authorization)) {
      filterChain.doFilter(request, response);
      return;
    }

    if (!authorization.startsWith("Bearer ")) {
      SecurityJsonWriter.write(response, objectMapper, HttpStatus.UNAUTHORIZED, "Authentication token is required.");
      return;
    }

    String token = authorization.substring(7).trim();

    if (!StringUtils.hasText(token)) {
      SecurityJsonWriter.write(response, objectMapper, HttpStatus.UNAUTHORIZED, "Authentication token is required.");
      return;
    }

    try {
      AuthenticatedUser user = jwtService.parse(token);
      UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
        user,
        token,
        List.of(new SimpleGrantedAuthority("ROLE_" + user.role()))
      );

      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);
    } catch (JwtException | IllegalArgumentException exception) {
      SecurityContextHolder.clearContext();
      SecurityJsonWriter.write(response, objectMapper, HttpStatus.UNAUTHORIZED, "Invalid authentication token.");
    }
  }
}
