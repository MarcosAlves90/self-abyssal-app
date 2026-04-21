package com.abyssal.operations.repository;

import com.abyssal.operations.domain.OrderEntity;
import com.abyssal.operations.domain.OrderStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
  List<OrderEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

  List<OrderEntity> findByStatusOrderByCreatedAtDesc(OrderStatus status);

  List<OrderEntity> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, OrderStatus status);
}
