package com.abyssal.operations.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OperationsPayloads {
  private OperationsPayloads() {
  }

  public record ReservationCreateRequest(
    @NotNull UUID branchId,
    @NotNull @Future Instant scheduledAt,
    @NotNull @Min(1) @Max(12) Integer guests,
    @NotBlank @Size(min = 3, max = 40) String depthLevel,
    @Size(max = 200) String specialRequest
  ) {
  }

  public record ReservationUpdateRequest(
    UUID branchId,
    @Future Instant scheduledAt,
    @Min(1) @Max(12) Integer guests,
    @Size(min = 3, max = 40) String depthLevel,
    @Pattern(regexp = "^(confirmed|checked_in|completed|cancelled)$", message = "status must be one of confirmed, checked_in, completed or cancelled.") String status,
    @Size(max = 200) String specialRequest
  ) {
    public boolean hasAnyField() {
      return branchId != null || scheduledAt != null || guests != null || depthLevel != null || status != null || specialRequest != null;
    }
  }

  public record ReservationResponse(
    String id,
    String userId,
    String branchId,
    String branchName,
    Instant scheduledAt,
    Integer guests,
    String depthLevel,
    String status,
    String specialRequest
  ) {
  }

  public record OrderItemRequest(
    @NotNull UUID menuItemId,
    @NotNull @Min(1) @Max(20) Integer quantity,
    @Size(max = 120) String note
  ) {
  }

  public record OrderCreateRequest(
    UUID branchId,
    UUID reservationId,
    @NotBlank @Pattern(regexp = "^(delivery|dine_in)$", message = "fulfillmentType must be delivery or dine_in.") String fulfillmentType,
    @NotEmpty List<@Valid OrderItemRequest> items,
    @NotBlank @Pattern(regexp = "^(in_app_card_tokenized|card_on_delivery|on_site)$", message = "paymentMethod must be one of in_app_card_tokenized, card_on_delivery or on_site.") String paymentMethod,
    @Size(min = 10, max = 200) String deliveryAddress,
    @Size(min = 3, max = 80) String contactName
  ) {
  }

  public record OrderUpdateRequest(
    @Pattern(regexp = "^(pending|preparing|on_the_way|served|completed|cancelled)$", message = "status must be one of pending, preparing, on_the_way, served, completed or cancelled.") String status,
    @Pattern(regexp = "^(pending|authorized|paid)$", message = "paymentStatus must be one of pending, authorized or paid.") String paymentStatus
  ) {
    public boolean hasAnyField() {
      return status != null || paymentStatus != null;
    }
  }

  public record OrderResponse(
    String id,
    String userId,
    String branchId,
    String branchName,
    String reservationId,
    String fulfillmentType,
    String status,
    String paymentMethod,
    String paymentStatus,
    Integer totalCents,
    String deliveryAddress,
    String contactName,
    List<OrderItemResponse> items,
    Instant createdAt
  ) {
  }

  public record OrderItemResponse(
    String menuItemId,
    String name,
    Integer quantity,
    Integer unitPriceCents,
    String note
  ) {
  }
}
