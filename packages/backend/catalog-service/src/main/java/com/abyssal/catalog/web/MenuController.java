package com.abyssal.catalog.web;

import com.abyssal.catalog.application.CatalogService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
@Tag(name = "Menu")
public class MenuController {
  private final CatalogService catalogService;

  public MenuController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public Map<String, Object> listMenu(
    @RequestParam(name = "category", required = false) String category,
    @RequestParam(name = "featured", required = false) Boolean featured
  ) {
    return Map.of("items", catalogService.listMenu(category, featured));
  }

  @GetMapping("/{menuItemId}")
  public Map<String, Object> getMenuItem(@PathVariable UUID menuItemId) {
    return Map.of("item", catalogService.getMenuItem(menuItemId));
  }

  @PostMapping
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<Map<String, Object>> createMenuItem(
    @Parameter(hidden = true)
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @Valid @RequestBody CatalogPayloads.MenuItemUpsertRequest request
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(Map.of("item", catalogService.createMenuItem(request)));
  }

  @PatchMapping("/{menuItemId}")
  @SecurityRequirement(name = "bearerAuth")
  public Map<String, Object> updateMenuItem(
    @Parameter(hidden = true)
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @PathVariable UUID menuItemId,
    @Valid @RequestBody CatalogPayloads.MenuItemUpdateRequest request
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    return Map.of("item", catalogService.updateMenuItem(menuItemId, request));
  }

  @DeleteMapping("/{menuItemId}")
  @SecurityRequirement(name = "bearerAuth")
  public ResponseEntity<Void> deleteMenuItem(
    @Parameter(hidden = true)
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @PathVariable UUID menuItemId
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    catalogService.deleteMenuItem(menuItemId);
    return ResponseEntity.noContent().build();
  }
}
