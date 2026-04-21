package com.abyssal.operations.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "orders")
public class OrderEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "branch_id")
  private UUID branchId;

  @Column(name = "branch_name_snapshot", length = 80)
  private String branchNameSnapshot;

  @Column(name = "reservation_id")
  private UUID reservationId;

  @Enumerated(EnumType.STRING)
  @Column(name = "fulfillment_type", nullable = false, length = 20)
  private FulfillmentType fulfillmentType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrderStatus status = OrderStatus.PENDING;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false, length = 30)
  private PaymentMethod paymentMethod;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_status", nullable = false, length = 20)
  private PaymentStatus paymentStatus = PaymentStatus.PENDING;

  @Column(name = "delivery_address_encrypted", columnDefinition = "TEXT")
  private String deliveryAddressEncrypted;

  @Column(name = "contact_name_encrypted", columnDefinition = "TEXT")
  private String contactNameEncrypted;

  @Column(name = "total_cents", nullable = false)
  private Integer totalCents;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItemEntity> items = new ArrayList<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public UUID getBranchId() {
    return branchId;
  }

  public void setBranchId(UUID branchId) {
    this.branchId = branchId;
  }

  public String getBranchNameSnapshot() {
    return branchNameSnapshot;
  }

  public void setBranchNameSnapshot(String branchNameSnapshot) {
    this.branchNameSnapshot = branchNameSnapshot;
  }

  public UUID getReservationId() {
    return reservationId;
  }

  public void setReservationId(UUID reservationId) {
    this.reservationId = reservationId;
  }

  public FulfillmentType getFulfillmentType() {
    return fulfillmentType;
  }

  public void setFulfillmentType(FulfillmentType fulfillmentType) {
    this.fulfillmentType = fulfillmentType;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public PaymentMethod getPaymentMethod() {
    return paymentMethod;
  }

  public void setPaymentMethod(PaymentMethod paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  public PaymentStatus getPaymentStatus() {
    return paymentStatus;
  }

  public void setPaymentStatus(PaymentStatus paymentStatus) {
    this.paymentStatus = paymentStatus;
  }

  public String getDeliveryAddressEncrypted() {
    return deliveryAddressEncrypted;
  }

  public void setDeliveryAddressEncrypted(String deliveryAddressEncrypted) {
    this.deliveryAddressEncrypted = deliveryAddressEncrypted;
  }

  public String getContactNameEncrypted() {
    return contactNameEncrypted;
  }

  public void setContactNameEncrypted(String contactNameEncrypted) {
    this.contactNameEncrypted = contactNameEncrypted;
  }

  public Integer getTotalCents() {
    return totalCents;
  }

  public void setTotalCents(Integer totalCents) {
    this.totalCents = totalCents;
  }

  public List<OrderItemEntity> getItems() {
    return items;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void replaceItems(List<OrderItemEntity> items) {
    this.items.clear();
    items.forEach(item -> item.setOrder(this));
    this.items.addAll(items);
  }
}
