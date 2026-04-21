package com.abyssal.identity.application;

import com.abyssal.identity.config.SeedProperties;
import com.abyssal.identity.domain.UserEntity;
import com.abyssal.identity.domain.UserRole;
import com.abyssal.identity.repository.UserRepository;
import com.abyssal.shared.crypto.HashingService;
import com.abyssal.shared.crypto.TextCrypto;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class IdentitySeeder implements ApplicationRunner {
  private final SeedProperties seedProperties;
  private final UserRepository userRepository;
  private final HashingService hashingService;
  private final TextCrypto textCrypto;
  private final PasswordEncoder passwordEncoder;

  public IdentitySeeder(
    SeedProperties seedProperties,
    UserRepository userRepository,
    HashingService hashingService,
    TextCrypto textCrypto,
    PasswordEncoder passwordEncoder
  ) {
    this.seedProperties = seedProperties;
    this.userRepository = userRepository;
    this.hashingService = hashingService;
    this.textCrypto = textCrypto;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!seedProperties.isEnabled()) {
      return;
    }

    String normalizedEmail = seedProperties.getAdminEmail().trim().toLowerCase();
    String emailHash = hashingService.sha256(normalizedEmail);

    if (userRepository.existsByEmailHash(emailHash)) {
      return;
    }

    UserEntity admin = new UserEntity();
    admin.setName(seedProperties.getAdminName().trim());
    admin.setEmailHash(emailHash);
    admin.setEmailEncrypted(textCrypto.encrypt(normalizedEmail));
    admin.setPasswordHash(passwordEncoder.encode(seedProperties.getAdminPassword()));
    admin.setRole(UserRole.ADMIN);

    userRepository.save(admin);
  }
}
