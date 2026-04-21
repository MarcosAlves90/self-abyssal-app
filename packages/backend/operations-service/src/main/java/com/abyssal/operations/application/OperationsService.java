package com.abyssal.operations.application;

import com.abyssal.operations.client.CatalogClient;
import com.abyssal.operations.domain.FulfillmentType;
import com.abyssal.operations.domain.OrderEntity;
import com.abyssal.operations.domain.OrderItemEntity;
import com.abyssal.operations.domain.OrderStatus;
import com.abyssal.operations.domain.PaymentMethod;
import com.abyssal.operations.domain.PaymentStatus;
import com.abyssal.operations.domain.ReservationEntity;
import com.abyssal.operations.domain.ReservationStatus;
import com.abyssal.operations.repository.OrderRepository;
import com.abyssal.operations.repository.ReservationRepository;
import com.abyssal.operations.web.OperationsPayloads;
import com.abyssal.shared.crypto.TextCrypto;
import com.abyssal.shared.error.ApiException;
import com.abyssal.shared.security.AuthenticatedUser;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class OperationsService {
  private final ReservationRepository reservationRepository;
  private final OrderRepository orderRepository;
  private final CatalogClient catalogClient;
  private final TextCrypto textCrypto;

  public OperationsService(
    ReservationRepository reservationRepository,
    OrderRepository orderRepository,
    CatalogClient catalogClient,
    TextCrypto textCrypto
  ) {
    this.reservationRepository = reservationRepository;
    this.orderRepository = orderRepository;
    this.catalogClient = catalogClient;
    this.textCrypto = textCrypto;
  }

  @Transactional(readOnly = true)
  public List<OperationsPayloads.ReservationResponse> listReservations(
    AuthenticatedUser user,
    String status
  ) {
    ReservationStatus filter = status == null ? null : parseReservationStatus(status);
    List<ReservationEntity> reservations = isAdmin(user)
      ? filter == null
        ? reservationRepository.findAll().stream().sorted(Comparator.comparing(ReservationEntity::getScheduledAt)).toList()
        : reservationRepository.findByStatusOrderByScheduledAtAsc(filter)
      : filter == null
        ? reservationRepository.findByUserIdOrderByScheduledAtAsc(user.id())
        : reservationRepository.findByUserIdAndStatusOrderByScheduledAtAsc(user.id(), filter);

    return reservations.stream().map(this::toReservationResponse).toList();
  }

  @Transactional(readOnly = true)
  public OperationsPayloads.ReservationResponse getReservation(UUID reservationId, AuthenticatedUser user) {
    ReservationEntity reservation = findReservation(reservationId);
    assertOwnershipOrAdmin(user, reservation.getUserId(), "Reservation access denied.");
    return toReservationResponse(reservation);
  }

  @Transactional
  public OperationsPayloads.ReservationResponse createReservation(
    OperationsPayloads.ReservationCreateRequest request,
    AuthenticatedUser user
  ) {
    CatalogClient.BranchSnapshot branch = catalogClient.getBranch(request.branchId());

    if (!branch.reservationDepths().contains(request.depthLevel().trim())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Selected branch does not support this depth level.");
    }

    ReservationEntity reservation = new ReservationEntity();
    reservation.setUserId(user.id());
    reservation.setBranchId(request.branchId());
    reservation.setBranchNameSnapshot(branch.name());
    reservation.setScheduledAt(request.scheduledAt());
    reservation.setGuests(request.guests());
    reservation.setDepthLevel(request.depthLevel().trim());
    reservation.setSpecialRequestEncrypted(textCrypto.encrypt(trimOrNull(request.specialRequest())));

    return toReservationResponse(reservationRepository.save(reservation));
  }

  @Transactional
  public OperationsPayloads.ReservationResponse updateReservation(
    UUID reservationId,
    OperationsPayloads.ReservationUpdateRequest request,
    AuthenticatedUser user
  ) {
    if (!request.hasAnyField()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one reservation field must be provided.");
    }

    ReservationEntity reservation = findReservation(reservationId);
    assertOwnershipOrAdmin(user, reservation.getUserId(), "Reservation access denied.");

    if (!isAdmin(user) && request.status() != null && parseReservationStatus(request.status()) != ReservationStatus.CANCELLED) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can apply this reservation status.");
    }

    UUID nextBranchId = request.branchId() == null ? reservation.getBranchId() : request.branchId();
    String nextDepthLevel = request.depthLevel() == null ? reservation.getDepthLevel() : request.depthLevel().trim();

    if (request.branchId() != null || request.depthLevel() != null) {
      CatalogClient.BranchSnapshot branch = catalogClient.getBranch(nextBranchId);

      if (!branch.reservationDepths().contains(nextDepthLevel)) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Selected branch does not support this depth level.");
      }

      reservation.setBranchId(nextBranchId);
      reservation.setBranchNameSnapshot(branch.name());
      reservation.setDepthLevel(nextDepthLevel);
    }

    if (request.scheduledAt() != null) {
      reservation.setScheduledAt(request.scheduledAt());
    }

    if (request.guests() != null) {
      reservation.setGuests(request.guests());
    }

    if (request.status() != null) {
      reservation.setStatus(parseReservationStatus(request.status()));
    }

    if (request.specialRequest() != null) {
      reservation.setSpecialRequestEncrypted(textCrypto.encrypt(trimOrNull(request.specialRequest())));
    }

    return toReservationResponse(reservationRepository.save(reservation));
  }

  @Transactional
  public void deleteReservation(UUID reservationId, AuthenticatedUser user) {
    ReservationEntity reservation = findReservation(reservationId);
    assertOwnershipOrAdmin(user, reservation.getUserId(), "Reservation access denied.");
    reservationRepository.delete(reservation);
  }

  @Transactional(readOnly = true)
  public List<OperationsPayloads.OrderResponse> listOrders(AuthenticatedUser user, String status) {
    OrderStatus filter = status == null ? null : parseOrderStatus(status);
    List<OrderEntity> orders = isAdmin(user)
      ? filter == null
        ? orderRepository.findAll().stream().sorted(Comparator.comparing(OrderEntity::getCreatedAt).reversed()).toList()
        : orderRepository.findByStatusOrderByCreatedAtDesc(filter)
      : filter == null
        ? orderRepository.findByUserIdOrderByCreatedAtDesc(user.id())
        : orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.id(), filter);

    return orders.stream().map(this::toOrderResponse).toList();
  }

  @Transactional(readOnly = true)
  public OperationsPayloads.OrderResponse getOrder(UUID orderId, AuthenticatedUser user) {
    OrderEntity order = findOrder(orderId);
    assertOwnershipOrAdmin(user, order.getUserId(), "Order access denied.");
    return toOrderResponse(order);
  }

  @Transactional
  public OperationsPayloads.OrderResponse createOrder(
    OperationsPayloads.OrderCreateRequest request,
    AuthenticatedUser user
  ) {
    FulfillmentType fulfillmentType = parseFulfillmentType(request.fulfillmentType());
    PaymentMethod paymentMethod = parsePaymentMethod(request.paymentMethod());

    if (fulfillmentType == FulfillmentType.DELIVERY && !StringUtils.hasText(request.deliveryAddress())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "deliveryAddress is required for delivery orders.");
    }

    UUID branchId = request.branchId();
    String branchName = null;

    ReservationEntity reservation = null;

    if (request.reservationId() != null) {
      reservation = findReservation(request.reservationId());
      assertOwnershipOrAdmin(user, reservation.getUserId(), "Reservation access denied for this order.");

      if (branchId == null) {
        branchId = reservation.getBranchId();
        branchName = reservation.getBranchNameSnapshot();
      } else if (!branchId.equals(reservation.getBranchId())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Reservation branch must match the selected branch.");
      }
    }

    if (fulfillmentType == FulfillmentType.DINE_IN && branchId == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "branchId is required for dine-in orders.");
    }

    if (branchId != null && branchName == null) {
      CatalogClient.BranchSnapshot branch = catalogClient.getBranch(branchId);
      branchName = branch.name();
    }

    List<UUID> menuItemIds = request.items().stream()
      .map(OperationsPayloads.OrderItemRequest::menuItemId)
      .distinct()
      .toList();
    Map<UUID, CatalogClient.MenuItemSnapshot> menuItems = catalogClient.lookupMenuItems(menuItemIds).stream()
      .collect(Collectors.toMap(item -> UUID.fromString(item.id()), item -> item));

    List<OrderItemEntity> orderItems = request.items().stream()
      .map(item -> toOrderItem(item, menuItems, fulfillmentType))
      .toList();

    OrderEntity order = new OrderEntity();
    order.setUserId(user.id());
    order.setBranchId(branchId);
    order.setBranchNameSnapshot(branchName);
    order.setReservationId(reservation == null ? null : reservation.getId());
    order.setFulfillmentType(fulfillmentType);
    order.setPaymentMethod(paymentMethod);
    order.setPaymentStatus(paymentMethod == PaymentMethod.IN_APP_CARD_TOKENIZED ? PaymentStatus.AUTHORIZED : PaymentStatus.PENDING);
    order.setDeliveryAddressEncrypted(textCrypto.encrypt(trimOrNull(request.deliveryAddress())));
    order.setContactNameEncrypted(textCrypto.encrypt(trimOrNull(request.contactName())));
    order.setTotalCents(orderItems.stream().mapToInt(item -> item.getQuantity() * item.getUnitPriceCents()).sum());
    order.replaceItems(orderItems);

    return toOrderResponse(orderRepository.save(order));
  }

  @Transactional
  public OperationsPayloads.OrderResponse updateOrder(
    UUID orderId,
    OperationsPayloads.OrderUpdateRequest request,
    AuthenticatedUser user
  ) {
    if (!request.hasAnyField()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one order field must be provided.");
    }

    OrderEntity order = findOrder(orderId);
    assertOwnershipOrAdmin(user, order.getUserId(), "Order access denied.");

    if (!isAdmin(user) && request.paymentStatus() != null) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can update payment status.");
    }

    if (!isAdmin(user) && request.status() != null && parseOrderStatus(request.status()) != OrderStatus.CANCELLED) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can apply this order status.");
    }

    if (request.status() != null) {
      order.setStatus(parseOrderStatus(request.status()));
    }

    if (request.paymentStatus() != null) {
      order.setPaymentStatus(parsePaymentStatus(request.paymentStatus()));
    }

    return toOrderResponse(orderRepository.save(order));
  }

  @Transactional
  public void deleteOrder(UUID orderId, AuthenticatedUser user) {
    OrderEntity order = findOrder(orderId);
    assertOwnershipOrAdmin(user, order.getUserId(), "Order access denied.");
    orderRepository.delete(order);
  }

  private ReservationEntity findReservation(UUID reservationId) {
    return reservationRepository.findById(reservationId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reservation not found."));
  }

  private OrderEntity findOrder(UUID orderId) {
    return orderRepository.findById(orderId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found."));
  }

  private OrderItemEntity toOrderItem(
    OperationsPayloads.OrderItemRequest item,
    Map<UUID, CatalogClient.MenuItemSnapshot> menuItems,
    FulfillmentType fulfillmentType
  ) {
    CatalogClient.MenuItemSnapshot menuItem = menuItems.get(item.menuItemId());

    if (menuItem == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "One or more menu items are invalid.");
    }

    if (fulfillmentType == FulfillmentType.DELIVERY && !menuItem.availableForDelivery()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "One or more menu items are not available for delivery.");
    }

    if (fulfillmentType == FulfillmentType.DINE_IN && !menuItem.availableForDineIn()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "One or more menu items are not available for dine-in.");
    }

    OrderItemEntity orderItem = new OrderItemEntity();
    orderItem.setMenuItemId(item.menuItemId());
    orderItem.setNameSnapshot(menuItem.name());
    orderItem.setQuantity(item.quantity());
    orderItem.setUnitPriceCents(menuItem.priceCents());
    orderItem.setNoteEncrypted(textCrypto.encrypt(trimOrNull(item.note())));
    return orderItem;
  }

  private OperationsPayloads.ReservationResponse toReservationResponse(ReservationEntity reservation) {
    return new OperationsPayloads.ReservationResponse(
      reservation.getId().toString(),
      reservation.getUserId().toString(),
      reservation.getBranchId().toString(),
      reservation.getBranchNameSnapshot(),
      reservation.getScheduledAt(),
      reservation.getGuests(),
      reservation.getDepthLevel(),
      reservation.getStatus().getApiValue(),
      textCrypto.decrypt(reservation.getSpecialRequestEncrypted())
    );
  }

  private OperationsPayloads.OrderResponse toOrderResponse(OrderEntity order) {
    return new OperationsPayloads.OrderResponse(
      order.getId().toString(),
      order.getUserId().toString(),
      order.getBranchId() == null ? null : order.getBranchId().toString(),
      order.getBranchNameSnapshot(),
      order.getReservationId() == null ? null : order.getReservationId().toString(),
      order.getFulfillmentType().getApiValue(),
      order.getStatus().getApiValue(),
      order.getPaymentMethod().getApiValue(),
      order.getPaymentStatus().getApiValue(),
      order.getTotalCents(),
      textCrypto.decrypt(order.getDeliveryAddressEncrypted()),
      textCrypto.decrypt(order.getContactNameEncrypted()),
      order.getItems().stream().map(item -> new OperationsPayloads.OrderItemResponse(
        item.getMenuItemId().toString(),
        item.getNameSnapshot(),
        item.getQuantity(),
        item.getUnitPriceCents(),
        textCrypto.decrypt(item.getNoteEncrypted())
      )).toList(),
      order.getCreatedAt()
    );
  }

  private void assertOwnershipOrAdmin(AuthenticatedUser user, UUID resourceUserId, String message) {
    if (!isAdmin(user) && !user.id().equals(resourceUserId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, message);
    }
  }

  private boolean isAdmin(AuthenticatedUser user) {
    return "ADMIN".equalsIgnoreCase(user.role());
  }

  private String trimOrNull(String value) {
    return StringUtils.hasText(value) ? value.trim() : null;
  }

  private ReservationStatus parseReservationStatus(String value) {
    try {
      return ReservationStatus.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }

  private OrderStatus parseOrderStatus(String value) {
    try {
      return OrderStatus.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }

  private PaymentStatus parsePaymentStatus(String value) {
    try {
      return PaymentStatus.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }

  private PaymentMethod parsePaymentMethod(String value) {
    try {
      return PaymentMethod.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }

  private FulfillmentType parseFulfillmentType(String value) {
    try {
      return FulfillmentType.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }
}
