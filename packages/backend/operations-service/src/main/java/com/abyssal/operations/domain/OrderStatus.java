package com.abyssal.operations.domain;

public enum OrderStatus {
  PENDING("pending"),
  PREPARING("preparing"),
  ON_THE_WAY("on_the_way"),
  SERVED("served"),
  COMPLETED("completed"),
  CANCELLED("cancelled");

  private final String apiValue;

  OrderStatus(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static OrderStatus fromApi(String value) {
    for (OrderStatus status : values()) {
      if (status.apiValue.equalsIgnoreCase(value)) {
        return status;
      }
    }

    throw new IllegalArgumentException("Status do pedido desconhecido: " + value);
  }
}
