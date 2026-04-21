package com.abyssal.identity.application;

import com.abyssal.identity.domain.UserAddressEntity;
import com.abyssal.identity.domain.UserEntity;
import com.abyssal.identity.domain.UserRole;
import com.abyssal.identity.repository.UserRepository;
import com.abyssal.identity.web.AuthPayloads;
import com.abyssal.shared.crypto.HashingService;
import com.abyssal.shared.crypto.TextCrypto;
import com.abyssal.shared.error.ApiException;
import com.abyssal.shared.security.JwtService;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final HashingService hashingService;
  private final TextCrypto textCrypto;

  public AuthService(
    UserRepository userRepository,
    PasswordEncoder passwordEncoder,
    JwtService jwtService,
    HashingService hashingService,
    TextCrypto textCrypto
  ) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.hashingService = hashingService;
    this.textCrypto = textCrypto;
  }

  @Transactional
  public AuthPayloads.AuthResponse register(AuthPayloads.RegisterRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    String emailHash = hashingService.sha256(normalizedEmail);

    if (userRepository.existsByEmailHash(emailHash)) {
      throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
    }

    UserEntity user = new UserEntity();
    user.setName(request.name().trim());
    user.setEmailHash(emailHash);
    user.setEmailEncrypted(textCrypto.encrypt(normalizedEmail));
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setPhoneEncrypted(textCrypto.encrypt(normalizeOptional(request.phone())));
    user.setRole(UserRole.CUSTOMER);

    UserEntity persistedUser = userRepository.save(user);
    return new AuthPayloads.AuthResponse(jwtService.generate(persistedUser.getId(), persistedUser.getRole().name()), toUserResponse(persistedUser));
  }

  @Transactional(readOnly = true)
  public AuthPayloads.AuthResponse login(AuthPayloads.LoginRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    String emailHash = hashingService.sha256(normalizedEmail);

    UserEntity user = userRepository.findByEmailHash(emailHash)
      .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }

    return new AuthPayloads.AuthResponse(jwtService.generate(user.getId(), user.getRole().name()), toUserResponse(user));
  }

  @Transactional(readOnly = true)
  public AuthPayloads.UserResponse getCurrentUser(UUID userId) {
    UserEntity user = userRepository.findById(userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Authenticated user not found."));

    return toUserResponse(user);
  }

  @Transactional
  public AuthPayloads.UserResponse savePrimaryAddress(UUID userId, AuthPayloads.AddressUpsertRequest request) {
    UserEntity user = userRepository.findById(userId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Authenticated user not found."));

    UserAddressEntity address = new UserAddressEntity();
    address.setLabel(StringUtils.hasText(request.label()) ? request.label().trim() : "Principal");
    address.setPostalCodeEncrypted(textCrypto.encrypt(normalizePostalCode(request.postalCode())));
    address.setStreetEncrypted(textCrypto.encrypt(request.street().trim()));
    address.setNumberEncrypted(textCrypto.encrypt(request.number().trim()));
    address.setComplementEncrypted(textCrypto.encrypt(normalizeOptional(request.complement())));
    address.setNeighborhoodEncrypted(textCrypto.encrypt(request.neighborhood().trim()));
    address.setCityEncrypted(textCrypto.encrypt(request.city().trim()));
    address.setStateEncrypted(textCrypto.encrypt(request.state().trim().toUpperCase()));
    address.setSummaryEncrypted(textCrypto.encrypt(buildAddressSummary(request)));

    user.replacePrimaryAddress(address);
    UserEntity persistedUser = userRepository.save(user);
    return toUserResponse(persistedUser);
  }

  private AuthPayloads.UserResponse toUserResponse(UserEntity user) {
    List<AuthPayloads.AddressResponse> addresses = user.getAddresses().stream()
      .sorted(Comparator.comparing(UserAddressEntity::isPrimaryAddress).reversed())
      .map(this::toAddressResponse)
      .toList();

    return new AuthPayloads.UserResponse(
      user.getId().toString(),
      user.getName(),
      textCrypto.decrypt(user.getEmailEncrypted()),
      user.getRole().name().toLowerCase(),
      addresses
    );
  }

  private AuthPayloads.AddressResponse toAddressResponse(UserAddressEntity address) {
    return new AuthPayloads.AddressResponse(
      address.getLabel(),
      formatPostalCode(textCrypto.decrypt(address.getPostalCodeEncrypted())),
      textCrypto.decrypt(address.getStreetEncrypted()),
      textCrypto.decrypt(address.getNumberEncrypted()),
      textCrypto.decrypt(address.getComplementEncrypted()),
      textCrypto.decrypt(address.getNeighborhoodEncrypted()),
      textCrypto.decrypt(address.getCityEncrypted()),
      textCrypto.decrypt(address.getStateEncrypted()),
      textCrypto.decrypt(address.getSummaryEncrypted())
    );
  }

  private String buildAddressSummary(AuthPayloads.AddressUpsertRequest request) {
    String firstLine = join(", ", request.street().trim(), request.number().trim());
    String secondLine = join(", ", normalizeOptional(request.complement()), request.neighborhood().trim());
    String thirdLine = join(
      " • ",
      join(" - ", request.city().trim(), request.state().trim().toUpperCase()),
      "CEP " + formatPostalCode(normalizePostalCode(request.postalCode()))
    );

    return join(" • ", firstLine, secondLine, thirdLine);
  }

  private String join(String separator, String... values) {
    StringBuilder builder = new StringBuilder();

    for (String value : values) {
      if (!StringUtils.hasText(value)) {
        continue;
      }

      if (!builder.isEmpty()) {
        builder.append(separator);
      }

      builder.append(value);
    }

    return builder.isEmpty() ? null : builder.toString();
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private String normalizeOptional(String value) {
    return StringUtils.hasText(value) ? value.trim() : null;
  }

  private String normalizePostalCode(String postalCode) {
    return postalCode.replaceAll("\\D", "");
  }

  private String formatPostalCode(String postalCode) {
    if (!StringUtils.hasText(postalCode) || postalCode.length() != 8) {
      return postalCode;
    }

    return postalCode.substring(0, 5) + "-" + postalCode.substring(5);
  }
}
