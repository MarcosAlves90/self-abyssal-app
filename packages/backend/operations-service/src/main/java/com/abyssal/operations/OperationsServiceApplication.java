package com.abyssal.operations;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.abyssal")
public class OperationsServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OperationsServiceApplication.class, args);
  }
}
