package com.abyssal.operations.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.abyssal.operations.client.CatalogClient;
import com.abyssal.operations.domain.ReservationEntity;
import com.abyssal.operations.domain.ReservationStatus;
import com.abyssal.operations.repository.OrderRepository;
import com.abyssal.operations.repository.ReservationRepository;
import com.abyssal.operations.web.OperationsPayloads;
import com.abyssal.shared.crypto.TextCrypto;
import com.abyssal.shared.error.ApiException;
import com.abyssal.shared.security.AuthenticatedUser;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OperationsServiceTest {
  private static final String CONFLICT_MESSAGE =
    "An active reservation already exists for this branch, time and depth level.";

  @Mock
  private ReservationRepository reservationRepository;

  @Mock
  private OrderRepository orderRepository;

  @Mock
  private CatalogClient catalogClient;

  @Mock
  private TextCrypto textCrypto;

  private OperationsService operationsService;

  @BeforeEach
  void setUp() {
    operationsService = new OperationsService(reservationRepository, orderRepository, catalogClient, textCrypto);
  }

  @Test
  void createReservationRejectsAnOccupiedActiveSlot() {
    UUID branchId = UUID.randomUUID();
    Instant scheduledAt = Instant.parse("2026-05-01T18:00:00Z");
    AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), "CUSTOMER");

    when(catalogClient.getBranch(branchId))
      .thenReturn(new CatalogClient.BranchSnapshot(branchId.toString(), "Centro", List.of("premium")));
    when(reservationRepository.existsActiveReservationConflict(branchId, scheduledAt, "premium", ReservationStatus.CANCELLED, null))
      .thenReturn(true);

    ApiException exception = assertThrows(ApiException.class, () -> operationsService.createReservation(
      new OperationsPayloads.ReservationCreateRequest(branchId, scheduledAt, 4, " premium ", "Prefer window"),
      user
    ));

    assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    assertEquals(CONFLICT_MESSAGE, exception.getMessage());
    verify(reservationRepository, never()).saveAndFlush(any());
  }

  @Test
  void createReservationPersistsAFreeActiveSlot() {
    UUID branchId = UUID.randomUUID();
    Instant scheduledAt = Instant.parse("2026-05-01T18:00:00Z");
    UUID reservationId = UUID.randomUUID();
    AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), "CUSTOMER");

    when(catalogClient.getBranch(branchId))
      .thenReturn(new CatalogClient.BranchSnapshot(branchId.toString(), "Centro", List.of("premium")));
    when(reservationRepository.existsActiveReservationConflict(branchId, scheduledAt, "premium", ReservationStatus.CANCELLED, null))
      .thenReturn(false);
    when(textCrypto.encrypt("Prefer window")).thenReturn("cipher-text");
    when(textCrypto.decrypt("cipher-text")).thenReturn("Prefer window");
    when(reservationRepository.saveAndFlush(any())).thenAnswer(invocation -> {
      ReservationEntity reservation = invocation.getArgument(0);
      ReflectionTestUtils.setField(reservation, "id", reservationId);
      return reservation;
    });

    OperationsPayloads.ReservationResponse response = operationsService.createReservation(
      new OperationsPayloads.ReservationCreateRequest(branchId, scheduledAt, 4, "premium", "Prefer window"),
      user
    );

    ArgumentCaptor<ReservationEntity> reservationCaptor = ArgumentCaptor.forClass(ReservationEntity.class);
    verify(reservationRepository).saveAndFlush(reservationCaptor.capture());
    ReservationEntity reservation = reservationCaptor.getValue();

    assertEquals(user.id(), reservation.getUserId());
    assertEquals(branchId, reservation.getBranchId());
    assertEquals(scheduledAt, reservation.getScheduledAt());
    assertEquals("premium", reservation.getDepthLevel());
    assertEquals("cipher-text", reservation.getSpecialRequestEncrypted());
    assertEquals(reservationId.toString(), response.id());
    assertNotNull(response.branchName());
  }

  @Test
  void updateReservationIgnoresTheCurrentReservationSlot() {
    UUID branchId = UUID.randomUUID();
    UUID reservationId = UUID.randomUUID();
    Instant scheduledAt = Instant.parse("2026-05-01T18:00:00Z");
    AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), "CUSTOMER");

    ReservationEntity reservation = new ReservationEntity();
    ReflectionTestUtils.setField(reservation, "id", reservationId);
    reservation.setUserId(user.id());
    reservation.setBranchId(branchId);
    reservation.setBranchNameSnapshot("Centro");
    reservation.setScheduledAt(scheduledAt);
    reservation.setGuests(4);
    reservation.setDepthLevel("premium");
    reservation.setStatus(ReservationStatus.CONFIRMED);

    when(reservationRepository.findById(reservationId)).thenReturn(java.util.Optional.of(reservation));
    when(reservationRepository.existsActiveReservationConflict(branchId, scheduledAt, "premium", ReservationStatus.CANCELLED, reservationId))
      .thenReturn(false);
    when(reservationRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(textCrypto.decrypt(null)).thenReturn(null);

    OperationsPayloads.ReservationResponse response = operationsService.updateReservation(
      reservationId,
      new OperationsPayloads.ReservationUpdateRequest(null, null, 6, null, null, null),
      user
    );

    verify(reservationRepository).existsActiveReservationConflict(branchId, scheduledAt, "premium", ReservationStatus.CANCELLED, reservationId);
    assertEquals(Integer.valueOf(6), reservation.getGuests());
    assertEquals(reservationId.toString(), response.id());
  }
}
