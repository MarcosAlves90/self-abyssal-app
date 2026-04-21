package com.abyssal.operations.domain;

public enum FulfillmentType {
  DELIVERY("delivery"),
  DINE_IN("dine_in");

  private final String apiValue;

  FulfillmentType(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static FulfillmentType fromApi(String value) {
    for (FulfillmentType type : values()) {
      if (type.apiValue.equalsIgnoreCase(value)) {
        return type;
      }
    }

    throw new IllegalArgumentException("Unknown fulfillment type: " + value);
  }
}
