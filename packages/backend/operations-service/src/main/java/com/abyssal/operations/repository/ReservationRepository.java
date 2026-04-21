package com.abyssal.operations.repository;

import com.abyssal.operations.domain.ReservationEntity;
import com.abyssal.operations.domain.ReservationStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {
  List<ReservationEntity> findByUserIdOrderByScheduledAtAsc(UUID userId);

  List<ReservationEntity> findByStatusOrderByScheduledAtAsc(ReservationStatus status);

  List<ReservationEntity> findByUserIdAndStatusOrderByScheduledAtAsc(UUID userId, ReservationStatus status);
}
