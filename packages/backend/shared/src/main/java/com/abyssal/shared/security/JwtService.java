package com.abyssal.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;

public class JwtService {
  private final SecretKey secretKey;

  public JwtService(SecurityProperties properties) {
    if (properties.getJwtSecret() == null || properties.getJwtSecret().length() < 32) {
      throw new IllegalStateException("APP_SECURITY_JWT_SECRET must contain at least 32 characters.");
    }

    this.secretKey = Keys.hmacShaKeyFor(properties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
  }

  public String generate(UUID userId, String role) {
    Instant now = Instant.now();

    return Jwts.builder()
      .subject(userId.toString())
      .claim("role", role)
      .issuedAt(Date.from(now))
      .expiration(Date.from(now.plus(7, ChronoUnit.DAYS)))
      .signWith(secretKey)
      .compact();
  }

  public AuthenticatedUser parse(String token) {
    Claims claims = Jwts.parser()
      .verifyWith(secretKey)
      .build()
      .parseSignedClaims(token)
      .getPayload();

    return new AuthenticatedUser(UUID.fromString(claims.getSubject()), claims.get("role", String.class));
  }
}
