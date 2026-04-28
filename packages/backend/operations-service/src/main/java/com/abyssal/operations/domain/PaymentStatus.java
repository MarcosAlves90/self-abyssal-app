package com.abyssal.operations.domain;

public enum PaymentStatus {
  PENDING("pending"),
  AUTHORIZED("authorized"),
  PAID("paid");

  private final String apiValue;

  PaymentStatus(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static PaymentStatus fromApi(String value) {
    for (PaymentStatus status : values()) {
      if (status.apiValue.equalsIgnoreCase(value)) {
        return status;
      }
    }

    throw new IllegalArgumentException("Status de pagamento desconhecido: " + value);
  }
}
