package com.abyssal.identity.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AuthPayloads {
  private AuthPayloads() {
  }

  public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 80) String name,
    @NotBlank @Email @Size(max = 120) String email,
    @NotBlank @Size(min = 8, max = 128) String password,
    @NotBlank @Pattern(regexp = "^\\d{10,11}$", message = "telefone deve conter 10 ou 11 dígitos.") String phone
  ) {
  }

  public record LoginRequest(
    @NotBlank @Email @Size(max = 120) String email,
    @NotBlank @Size(min = 8, max = 128) String password
  ) {
  }

  public record AddressUpsertRequest(
    @Size(min = 2, max = 40) String label,
    @NotBlank @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP deve conter 8 dígitos.") String postalCode,
    @NotBlank @Size(min = 3, max = 120) String street,
    @NotBlank @Size(min = 1, max = 20) String number,
    @Size(min = 1, max = 80) String complement,
    @NotBlank @Size(min = 2, max = 80) String neighborhood,
    @NotBlank @Size(min = 2, max = 80) String city,
    @NotBlank @Pattern(regexp = "^[a-zA-Z]{2}$", message = "UF deve conter 2 caracteres.") String state
  ) {
  }

  public record AuthResponse(String token, UserResponse user) {
  }

  public record UserResponse(
    String id,
    String name,
    String email,
    String role,
    List<AddressResponse> savedAddresses
  ) {
  }

  public record AddressResponse(
    String label,
    String postalCode,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String state,
    String summary
  ) {
  }
}
