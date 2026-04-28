package com.abyssal.operations.client;

import com.abyssal.operations.config.CatalogProperties;
import com.abyssal.shared.error.ApiException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class CatalogClient {
  private final RestClient restClient;

  public CatalogClient(CatalogProperties properties) {
    this.restClient = RestClient.builder()
      .baseUrl(properties.getBaseUrl())
      .defaultHeader("X-Forwarded-Proto", "https")
      .build();
  }

  public BranchSnapshot getBranch(UUID branchId) {
    try {
      return restClient.get()
        .uri("/internal/catalog/branches/{branchId}", branchId)
        .retrieve()
        .body(BranchSnapshot.class);
    } catch (RestClientResponseException exception) {
      if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
        throw new ApiException(HttpStatus.NOT_FOUND, "A filial selecionada não foi encontrada.");
      }

      throw new ApiException(HttpStatus.BAD_GATEWAY, "O serviço de catálogo está indisponível.");
    } catch (RestClientException exception) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "O serviço de catálogo está indisponível.");
    }
  }

  public List<MenuItemSnapshot> lookupMenuItems(List<UUID> ids) {
    try {
      MenuLookupResponse response = restClient.post()
        .uri("/internal/catalog/menu-items/lookup")
        .body(new MenuLookupRequest(ids))
        .retrieve()
        .body(MenuLookupResponse.class);

      return response == null || response.items() == null ? List.of() : response.items();
    } catch (RestClientResponseException exception) {
      if (exception.getStatusCode() == HttpStatus.BAD_REQUEST) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Um ou mais itens do menu são inválidos.");
      }

      throw new ApiException(HttpStatus.BAD_GATEWAY, "O serviço de catálogo está indisponível.");
    } catch (RestClientException exception) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "O serviço de catálogo está indisponível.");
    }
  }

  public record BranchSnapshot(String id, String name, List<String> reservationDepths) {
  }

  public record MenuItemSnapshot(
    String id,
    String name,
    Integer priceCents,
    boolean availableForDelivery,
    boolean availableForDineIn
  ) {
  }

  private record MenuLookupRequest(List<UUID> ids) {
  }

  private record MenuLookupResponse(List<MenuItemSnapshot> items) {
  }
}
