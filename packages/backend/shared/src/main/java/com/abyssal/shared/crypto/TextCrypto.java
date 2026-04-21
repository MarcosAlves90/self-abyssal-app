package com.abyssal.shared.crypto;

import com.abyssal.shared.security.SecurityProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.HexFormat;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.util.StringUtils;

public class TextCrypto {
  private static final String AES = "AES";
  private static final String TRANSFORMATION = "AES/GCM/NoPadding";
  private static final int GCM_TAG_LENGTH_BITS = 128;
  private static final int GCM_IV_LENGTH_BYTES = 12;

  private final SecretKeySpec keySpec;
  private final SecureRandom secureRandom = new SecureRandom();

  public TextCrypto(SecurityProperties properties) {
    if (!properties.getEncryptionKey().matches("^[0-9a-fA-F]{64}$")) {
      throw new IllegalStateException("APP_SECURITY_ENCRYPTION_KEY must contain exactly 64 hex characters.");
    }

    this.keySpec = new SecretKeySpec(HexFormat.of().parseHex(properties.getEncryptionKey()), AES);
  }

  public String encrypt(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }

    try {
      byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
      secureRandom.nextBytes(iv);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

      byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(iv) + ":" + HexFormat.of().formatHex(encrypted);
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Failed to encrypt sensitive data.", exception);
    }
  }

  public String decrypt(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }

    String[] parts = value.split(":");

    if (parts.length != 2) {
      throw new IllegalStateException("Encrypted payload is malformed.");
    }

    try {
      byte[] iv = HexFormat.of().parseHex(parts[0]);
      byte[] encrypted = HexFormat.of().parseHex(parts[1]);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

      return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    } catch (GeneralSecurityException exception) {
      throw new IllegalStateException("Failed to decrypt sensitive data.", exception);
    }
  }
}
