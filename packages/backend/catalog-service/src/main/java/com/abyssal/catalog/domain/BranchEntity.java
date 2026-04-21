package com.abyssal.catalog.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "branches")
public class BranchEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 80)
  private String name;

  @Column(nullable = false, unique = true, length = 50)
  private String slug;

  @Column(nullable = false, length = 80)
  private String city;

  @Column(nullable = false, length = 80)
  private String neighborhood;

  @Column(name = "address_line", nullable = false, length = 120)
  private String addressLine;

  @Column(name = "open_hours", nullable = false, length = 80)
  private String openHours;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "branch_reservation_depths", joinColumns = @JoinColumn(name = "branch_id"))
  @Column(name = "depth_level", nullable = false, length = 40)
  private List<String> reservationDepths = new ArrayList<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public String getNeighborhood() {
    return neighborhood;
  }

  public void setNeighborhood(String neighborhood) {
    this.neighborhood = neighborhood;
  }

  public String getAddressLine() {
    return addressLine;
  }

  public void setAddressLine(String addressLine) {
    this.addressLine = addressLine;
  }

  public String getOpenHours() {
    return openHours;
  }

  public void setOpenHours(String openHours) {
    this.openHours = openHours;
  }

  public List<String> getReservationDepths() {
    return reservationDepths;
  }

  public void setReservationDepths(List<String> reservationDepths) {
    this.reservationDepths = reservationDepths;
  }
}
