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
@RequestMapping("/api/orders")
public class OrdersController {
  private final OperationsService operationsService;

  public OrdersController(OperationsService operationsService) {
    this.operationsService = operationsService;
  }

  @GetMapping
  public Map<String, Object> listOrders(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @RequestParam(required = false) String status
  ) {
    return Map.of("orders", operationsService.listOrders(authenticatedUser, status));
  }

  @GetMapping("/{orderId}")
  public Map<String, Object> getOrder(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID orderId
  ) {
    return Map.of("order", operationsService.getOrder(orderId, authenticatedUser));
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> createOrder(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @Valid @RequestBody OperationsPayloads.OrderCreateRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(Map.of("order", operationsService.createOrder(request, authenticatedUser)));
  }

  @PatchMapping("/{orderId}")
  public Map<String, Object> updateOrder(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID orderId,
    @Valid @RequestBody OperationsPayloads.OrderUpdateRequest request
  ) {
    return Map.of("order", operationsService.updateOrder(orderId, request, authenticatedUser));
  }

  @DeleteMapping("/{orderId}")
  public ResponseEntity<Void> deleteOrder(
    @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
    @PathVariable UUID orderId
  ) {
    operationsService.deleteOrder(orderId, authenticatedUser);
    return ResponseEntity.noContent().build();
  }
}
