package com.abyssal.operations.domain;

public enum ReservationStatus {
  CONFIRMED("confirmed"),
  CHECKED_IN("checked_in"),
  COMPLETED("completed"),
  CANCELLED("cancelled");

  private final String apiValue;

  ReservationStatus(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static ReservationStatus fromApi(String value) {
    for (ReservationStatus status : values()) {
      if (status.apiValue.equalsIgnoreCase(value)) {
        return status;
      }
    }

    throw new IllegalArgumentException("Unknown reservation status: " + value);
  }
}
