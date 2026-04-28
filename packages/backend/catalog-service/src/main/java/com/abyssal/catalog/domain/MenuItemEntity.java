package com.abyssal.catalog.domain;

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
@Table(name = "menu_items")
public class MenuItemEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 80)
  private String name;

  @Column(nullable = false, unique = true, length = 60)
  private String slug;

  @Column(nullable = false, length = 300)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private MenuCategory category;

  @Column(name = "price_cents", nullable = false)
  private Integer priceCents;

  @Column(name = "is_featured", nullable = false)
  private boolean featured;

  @Column(name = "image_hint", length = 80)
  private String imageHint;

  @Column(name = "image_url", length = 300)
  private String imageUrl;

  @Column(name = "available_for_delivery", nullable = false)
  private boolean availableForDelivery = true;

  @Column(name = "available_for_dine_in", nullable = false)
  private boolean availableForDineIn = true;

  @Column(name = "accent_color", nullable = false, length = 20)
  private String accentColor = "#31e7ff";

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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public MenuCategory getCategory() {
    return category;
  }

  public void setCategory(MenuCategory category) {
    this.category = category;
  }

  public Integer getPriceCents() {
    return priceCents;
  }

  public void setPriceCents(Integer priceCents) {
    this.priceCents = priceCents;
  }

  public boolean isFeatured() {
    return featured;
  }

  public void setFeatured(boolean featured) {
    this.featured = featured;
  }

  public String getImageHint() {
    return imageHint;
  }

  public void setImageHint(String imageHint) {
    this.imageHint = imageHint;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public boolean isAvailableForDelivery() {
    return availableForDelivery;
  }

  public void setAvailableForDelivery(boolean availableForDelivery) {
    this.availableForDelivery = availableForDelivery;
  }

  public boolean isAvailableForDineIn() {
    return availableForDineIn;
  }

  public void setAvailableForDineIn(boolean availableForDineIn) {
    this.availableForDineIn = availableForDineIn;
  }

  public String getAccentColor() {
    return accentColor;
  }

  public void setAccentColor(String accentColor) {
    this.accentColor = accentColor;
  }
}
