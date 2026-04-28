package com.abyssal.operations.domain;

public enum PaymentMethod {
  IN_APP_CARD_TOKENIZED("in_app_card_tokenized"),
  CARD_ON_DELIVERY("card_on_delivery"),
  ON_SITE("on_site");

  private final String apiValue;

  PaymentMethod(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static PaymentMethod fromApi(String value) {
    for (PaymentMethod method : values()) {
      if (method.apiValue.equalsIgnoreCase(value)) {
        return method;
      }
    }

    throw new IllegalArgumentException("Método de pagamento desconhecido: " + value);
  }
}
