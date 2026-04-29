package com.abyssal.identity.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
  info = @Info(
    title = "Abyssal Identity API",
    version = "2.0.0",
    description = "Autenticação, perfil do usuário e endereço principal."
  ),
  servers = @Server(url = "/docs/identity")
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
