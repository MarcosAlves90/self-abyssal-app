package com.abyssal.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
  private String jwtSecret;
  private String encryptionKey;
  private boolean requireHttpsInProduction;

  public String getJwtSecret() {
    return jwtSecret;
  }

  public void setJwtSecret(String jwtSecret) {
    this.jwtSecret = jwtSecret;
  }

  public String getEncryptionKey() {
    return encryptionKey;
  }

  public void setEncryptionKey(String encryptionKey) {
    this.encryptionKey = encryptionKey;
  }

  public boolean isRequireHttpsInProduction() {
    return requireHttpsInProduction;
  }

  public void setRequireHttpsInProduction(boolean requireHttpsInProduction) {
    this.requireHttpsInProduction = requireHttpsInProduction;
  }
}
