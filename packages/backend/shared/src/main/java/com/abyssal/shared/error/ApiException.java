package com.abyssal.shared.error;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final Object details;

  public ApiException(HttpStatus status, String message) {
    this(status, message, null);
  }

  public ApiException(HttpStatus status, String message, Object details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public Object getDetails() {
    return details;
  }
}
