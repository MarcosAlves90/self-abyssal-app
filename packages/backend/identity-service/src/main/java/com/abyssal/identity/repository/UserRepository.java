package com.abyssal.identity.repository;

import com.abyssal.identity.domain.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
  boolean existsByEmailHash(String emailHash);

  @EntityGraph(attributePaths = "addresses")
  Optional<UserEntity> findByEmailHash(String emailHash);

  @EntityGraph(attributePaths = "addresses")
  Optional<UserEntity> findById(UUID id);
}
