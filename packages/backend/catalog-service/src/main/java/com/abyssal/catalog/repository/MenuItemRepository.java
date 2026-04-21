package com.abyssal.catalog.repository;

import com.abyssal.catalog.domain.MenuItemEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItemEntity, UUID> {
}
