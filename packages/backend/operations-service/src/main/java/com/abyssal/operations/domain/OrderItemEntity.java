package com.abyssal.operations.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id", nullable = false)
  private OrderEntity order;

  @Column(name = "menu_item_id", nullable = false)
  private UUID menuItemId;

  @Column(name = "name_snapshot", nullable = false, length = 80)
  private String nameSnapshot;

  @Column(nullable = false)
  private Integer quantity;

  @Column(name = "unit_price_cents", nullable = false)
  private Integer unitPriceCents;

  @Column(name = "note_encrypted", columnDefinition = "TEXT")
  private String noteEncrypted;

  public UUID getId() {
    return id;
  }

  public OrderEntity getOrder() {
    return order;
  }

  public void setOrder(OrderEntity order) {
    this.order = order;
  }

  public UUID getMenuItemId() {
    return menuItemId;
  }

  public void setMenuItemId(UUID menuItemId) {
    this.menuItemId = menuItemId;
  }

  public String getNameSnapshot() {
    return nameSnapshot;
  }

  public void setNameSnapshot(String nameSnapshot) {
    this.nameSnapshot = nameSnapshot;
  }

  public Integer getQuantity() {
    return quantity;
  }

  public void setQuantity(Integer quantity) {
    this.quantity = quantity;
  }

  public Integer getUnitPriceCents() {
    return unitPriceCents;
  }

  public void setUnitPriceCents(Integer unitPriceCents) {
    this.unitPriceCents = unitPriceCents;
  }

  public String getNoteEncrypted() {
    return noteEncrypted;
  }

  public void setNoteEncrypted(String noteEncrypted) {
    this.noteEncrypted = noteEncrypted;
  }
}
