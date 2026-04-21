package com.abyssal.shared.security;

import com.abyssal.shared.error.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

public final class SecurityJsonWriter {
  private SecurityJsonWriter() {
  }

  public static void write(
    HttpServletResponse response,
    ObjectMapper objectMapper,
    HttpStatus status,
    String message
  ) throws IOException {
    if (response.isCommitted()) {
      return;
    }

    response.setStatus(status.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), new ApiError(message, null));
  }
}
