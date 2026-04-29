package com.abyssal.operations.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
  info = @Info(
    title = "Abyssal Operations API",
    version = "2.0.0",
    description = "Reservas e pedidos do aplicativo."
  ),
  servers = @Server(url = "/docs/operations")
)
@SecurityScheme(
  name = "bearerAuth",
  type = SecuritySchemeType.HTTP,
  scheme = "bearer",
  bearerFormat = "JWT",
  in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
