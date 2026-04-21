package com.abyssal.operations.web;

import com.abyssal.operations.application.OperationsService;
import com.abyssal.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationsController {
  private final OperationsService operationsService;

  public ReservationsController(OperationsService operationsService) {
    this.operationsService = operationsService;
  }

  @GetMapping
  public Map<String, Object> listReservations(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @RequestParam(required = false) String status
  ) {
    return Map.of("reservations", operationsService.listReservations(authenticatedUser, status));
  }

  @GetMapping("/{reservationId}")
  public Map<String, Object> getReservation(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID reservationId
  ) {
    return Map.of("reservation", operationsService.getReservation(reservationId, authenticatedUser));
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> createReservation(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @Valid @RequestBody OperationsPayloads.ReservationCreateRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(Map.of("reservation", operationsService.createReservation(request, authenticatedUser)));
  }

  @PatchMapping("/{reservationId}")
  public Map<String, Object> updateReservation(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID reservationId,
    @Valid @RequestBody OperationsPayloads.ReservationUpdateRequest request
  ) {
    return Map.of("reservation", operationsService.updateReservation(reservationId, request, authenticatedUser));
  }

  @DeleteMapping("/{reservationId}")
  public ResponseEntity<Void> deleteReservation(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID reservationId
  ) {
    operationsService.deleteReservation(reservationId, authenticatedUser);
    return ResponseEntity.noContent().build();
  }
}
