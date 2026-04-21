package com.abyssal.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "user_addresses")
public class UserAddressEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserEntity user;

  @Column(nullable = false, length = 40)
  private String label;

  @Column(name = "postal_code_encrypted", nullable = false, columnDefinition = "TEXT")
  private String postalCodeEncrypted;

  @Column(name = "street_encrypted", nullable = false, columnDefinition = "TEXT")
  private String streetEncrypted;

  @Column(name = "number_encrypted", nullable = false, columnDefinition = "TEXT")
  private String numberEncrypted;

  @Column(name = "complement_encrypted", columnDefinition = "TEXT")
  private String complementEncrypted;

  @Column(name = "neighborhood_encrypted", nullable = false, columnDefinition = "TEXT")
  private String neighborhoodEncrypted;

  @Column(name = "city_encrypted", nullable = false, columnDefinition = "TEXT")
  private String cityEncrypted;

  @Column(name = "state_encrypted", nullable = false, columnDefinition = "TEXT")
  private String stateEncrypted;

  @Column(name = "summary_encrypted", nullable = false, columnDefinition = "TEXT")
  private String summaryEncrypted;

  @Column(name = "is_primary", nullable = false)
  private boolean primaryAddress = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public UUID getId() {
    return id;
  }

  public UserEntity getUser() {
    return user;
  }

  public void setUser(UserEntity user) {
    this.user = user;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getPostalCodeEncrypted() {
    return postalCodeEncrypted;
  }

  public void setPostalCodeEncrypted(String postalCodeEncrypted) {
    this.postalCodeEncrypted = postalCodeEncrypted;
  }

  public String getStreetEncrypted() {
    return streetEncrypted;
  }

  public void setStreetEncrypted(String streetEncrypted) {
    this.streetEncrypted = streetEncrypted;
  }

  public String getNumberEncrypted() {
    return numberEncrypted;
  }

  public void setNumberEncrypted(String numberEncrypted) {
    this.numberEncrypted = numberEncrypted;
  }

  public String getComplementEncrypted() {
    return complementEncrypted;
  }

  public void setComplementEncrypted(String complementEncrypted) {
    this.complementEncrypted = complementEncrypted;
  }

  public String getNeighborhoodEncrypted() {
    return neighborhoodEncrypted;
  }

  public void setNeighborhoodEncrypted(String neighborhoodEncrypted) {
    this.neighborhoodEncrypted = neighborhoodEncrypted;
  }

  public String getCityEncrypted() {
    return cityEncrypted;
  }

  public void setCityEncrypted(String cityEncrypted) {
    this.cityEncrypted = cityEncrypted;
  }

  public String getStateEncrypted() {
    return stateEncrypted;
  }

  public void setStateEncrypted(String stateEncrypted) {
    this.stateEncrypted = stateEncrypted;
  }

  public String getSummaryEncrypted() {
    return summaryEncrypted;
  }

  public void setSummaryEncrypted(String summaryEncrypted) {
    this.summaryEncrypted = summaryEncrypted;
  }

  public boolean isPrimaryAddress() {
    return primaryAddress;
  }

  public void setPrimaryAddress(boolean primaryAddress) {
    this.primaryAddress = primaryAddress;
  }
}
