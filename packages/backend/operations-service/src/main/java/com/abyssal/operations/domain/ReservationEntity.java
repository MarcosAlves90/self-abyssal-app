package com.abyssal.operations.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "reservations")
public class ReservationEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "branch_id", nullable = false)
  private UUID branchId;

  @Column(name = "branch_name_snapshot", nullable = false, length = 80)
  private String branchNameSnapshot;

  @Column(name = "scheduled_at", nullable = false)
  private Instant scheduledAt;

  @Column(nullable = false)
  private Integer guests;

  @Column(name = "depth_level", nullable = false, length = 40)
  private String depthLevel;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ReservationStatus status = ReservationStatus.CONFIRMED;

  @Column(name = "special_request_encrypted", columnDefinition = "TEXT")
  private String specialRequestEncrypted;

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

  public Instant getScheduledAt() {
    return scheduledAt;
  }

  public void setScheduledAt(Instant scheduledAt) {
    this.scheduledAt = scheduledAt;
  }

  public Integer getGuests() {
    return guests;
  }

  public void setGuests(Integer guests) {
    this.guests = guests;
  }

  public String getDepthLevel() {
    return depthLevel;
  }

  public void setDepthLevel(String depthLevel) {
    this.depthLevel = depthLevel;
  }

  public ReservationStatus getStatus() {
    return status;
  }

  public void setStatus(ReservationStatus status) {
    this.status = status;
  }

  public String getSpecialRequestEncrypted() {
    return specialRequestEncrypted;
  }

  public void setSpecialRequestEncrypted(String specialRequestEncrypted) {
    this.specialRequestEncrypted = specialRequestEncrypted;
  }
}
