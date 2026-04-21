package com.abyssal.identity.domain;

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
@Table(name = "users")
public class UserEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 80)
  private String name;

  @Column(name = "email_hash", nullable = false, unique = true, length = 64)
  private String emailHash;

  @Column(name = "email_encrypted", nullable = false, columnDefinition = "TEXT")
  private String emailEncrypted;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private UserRole role = UserRole.CUSTOMER;

  @Column(name = "phone_encrypted", columnDefinition = "TEXT")
  private String phoneEncrypted;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserAddressEntity> addresses = new ArrayList<>();

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

  public String getEmailHash() {
    return emailHash;
  }

  public void setEmailHash(String emailHash) {
    this.emailHash = emailHash;
  }

  public String getEmailEncrypted() {
    return emailEncrypted;
  }

  public void setEmailEncrypted(String emailEncrypted) {
    this.emailEncrypted = emailEncrypted;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public UserRole getRole() {
    return role;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }

  public String getPhoneEncrypted() {
    return phoneEncrypted;
  }

  public void setPhoneEncrypted(String phoneEncrypted) {
    this.phoneEncrypted = phoneEncrypted;
  }

  public List<UserAddressEntity> getAddresses() {
    return addresses;
  }

  public void replacePrimaryAddress(UserAddressEntity address) {
    this.addresses.clear();
    address.setPrimaryAddress(true);
    address.setUser(this);
    this.addresses.add(address);
  }
}
