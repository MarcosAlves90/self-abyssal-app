package com.abyssal.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.abyssal")
public class IdentityServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(IdentityServiceApplication.class, args);
  }
}
