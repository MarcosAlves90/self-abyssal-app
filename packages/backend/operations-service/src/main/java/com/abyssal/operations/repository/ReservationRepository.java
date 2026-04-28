package com.abyssal.operations.repository;

import com.abyssal.operations.domain.ReservationEntity;
import com.abyssal.operations.domain.ReservationStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {
  List<ReservationEntity> findByUserIdOrderByScheduledAtAsc(UUID userId);

  List<ReservationEntity> findByStatusOrderByScheduledAtAsc(ReservationStatus status);

  List<ReservationEntity> findByUserIdAndStatusOrderByScheduledAtAsc(UUID userId, ReservationStatus status);

  @Query("""
    select case when count(reservation) > 0 then true else false end
    from ReservationEntity reservation
    where reservation.branchId = :branchId
      and reservation.scheduledAt = :scheduledAt
      and reservation.depthLevel = :depthLevel
      and reservation.status <> :cancelledStatus
      and (:excludedReservationId is null or reservation.id <> :excludedReservationId)
  """)
  boolean existsActiveReservationConflict(
    @Param("branchId") UUID branchId,
    @Param("scheduledAt") Instant scheduledAt,
    @Param("depthLevel") String depthLevel,
    @Param("cancelledStatus") ReservationStatus cancelledStatus,
    @Param("excludedReservationId") UUID excludedReservationId
  );
}
