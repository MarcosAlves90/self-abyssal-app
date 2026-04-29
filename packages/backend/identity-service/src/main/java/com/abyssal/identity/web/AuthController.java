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
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
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
  @SecurityRequirement(name = "bearerAuth")
  public Map<String, AuthPayloads.UserResponse> getCurrentUser(
    @Parameter(hidden = true)
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser
  ) {
    return Map.of("user", authService.getCurrentUser(authenticatedUser.id()));
  }

  @PutMapping("/me/address")
  @SecurityRequirement(name = "bearerAuth")
  public Map<String, AuthPayloads.UserResponse> savePrimaryAddress(
    @Parameter(hidden = true)
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @Valid @RequestBody AuthPayloads.AddressUpsertRequest request
  ) {
    return Map.of("user", authService.savePrimaryAddress(authenticatedUser.id(), request));
  }
}
