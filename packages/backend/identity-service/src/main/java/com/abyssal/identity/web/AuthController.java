package com.abyssal.identity.web;

import com.abyssal.identity.application.AuthService;
import com.abyssal.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthPayloads.AuthResponse> register(
    @Valid @RequestBody AuthPayloads.RegisterRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
  }

  @PostMapping("/login")
  public AuthPayloads.AuthResponse login(@Valid @RequestBody AuthPayloads.LoginRequest request) {
    return authService.login(request);
  }

  @GetMapping("/me")
  public Map<String, AuthPayloads.UserResponse> getCurrentUser(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser
  ) {
    return Map.of("user", authService.getCurrentUser(authenticatedUser.id()));
  }

  @PutMapping("/me/address")
  public Map<String, AuthPayloads.UserResponse> savePrimaryAddress(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @Valid @RequestBody AuthPayloads.AddressUpsertRequest request
  ) {
    return Map.of("user", authService.savePrimaryAddress(authenticatedUser.id(), request));
  }
}
