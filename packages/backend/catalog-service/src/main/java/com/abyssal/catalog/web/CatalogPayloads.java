package com.abyssal.catalog.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class CatalogPayloads {
  private CatalogPayloads() {
  }

  public record BranchUpsertRequest(
    @NotBlank @Size(min = 3, max = 80) String name,
    @NotBlank @Size(min = 3, max = 50) String slug,
    @NotBlank @Size(min = 2, max = 80) String city,
    @NotBlank @Size(min = 2, max = 80) String neighborhood,
    @NotBlank @Size(min = 5, max = 120) String addressLine,
    @NotBlank @Size(min = 5, max = 80) String openHours,
    @NotEmpty List<@Size(min = 2, max = 40) String> reservationDepths
  ) {
  }

  public record BranchUpdateRequest(
    @Size(min = 3, max = 80) String name,
    @Size(min = 3, max = 50) String slug,
    @Size(min = 2, max = 80) String city,
    @Size(min = 2, max = 80) String neighborhood,
    @Size(min = 5, max = 120) String addressLine,
    @Size(min = 5, max = 80) String openHours,
    @Size(min = 1) List<@Size(min = 2, max = 40) String> reservationDepths
  ) {
    public boolean hasAnyField() {
      return name != null || slug != null || city != null || neighborhood != null || addressLine != null || openHours != null || reservationDepths != null;
    }
  }

  public record MenuItemUpsertRequest(
    @NotBlank @Size(min = 3, max = 80) String name,
    @NotBlank @Size(min = 3, max = 60) String slug,
    @NotBlank @Size(min = 10, max = 300) String description,
    @NotBlank @Pattern(regexp = "^(entradas|principais|sobremesas|bebidas)$", message = "category must be one of entradas, principais, sobremesas or bebidas.") String category,
    @Min(1) @Max(1000000) Integer priceCents,
    Boolean isFeatured,
    @Size(max = 80) String imageHint,
    Boolean availableForDelivery,
    Boolean availableForDineIn,
    @Size(max = 20) String accentColor
  ) {
  }

  public record MenuItemUpdateRequest(
    @Size(min = 3, max = 80) String name,
    @Size(min = 3, max = 60) String slug,
    @Size(min = 10, max = 300) String description,
    @Pattern(regexp = "^(entradas|principais|sobremesas|bebidas)$", message = "category must be one of entradas, principais, sobremesas or bebidas.") String category,
    @Min(1) @Max(1000000) Integer priceCents,
    Boolean isFeatured,
    @Size(max = 80) String imageHint,
    Boolean availableForDelivery,
    Boolean availableForDineIn,
    @Size(max = 20) String accentColor
  ) {
    public boolean hasAnyField() {
      return name != null || slug != null || description != null || category != null || priceCents != null || isFeatured != null || imageHint != null || availableForDelivery != null || availableForDineIn != null || accentColor != null;
    }
  }

  public record BranchResponse(
    String id,
    String name,
    String slug,
    String city,
    String neighborhood,
    String addressLine,
    String openHours,
    List<String> reservationDepths
  ) {
  }

  public record MenuItemResponse(
    String id,
    String name,
    String slug,
    String description,
    String category,
    Integer priceCents,
    boolean isFeatured,
    String imageHint,
    boolean availableForDelivery,
    boolean availableForDineIn,
    String accentColor
  ) {
  }

  public record InternalBranchResponse(String id, String name, List<String> reservationDepths) {
  }

  public record InternalMenuLookupRequest(@NotEmpty List<UUID> ids) {
  }

  public record InternalMenuItemResponse(
    String id,
    String name,
    Integer priceCents,
    boolean availableForDelivery,
    boolean availableForDineIn
  ) {
  }
}
