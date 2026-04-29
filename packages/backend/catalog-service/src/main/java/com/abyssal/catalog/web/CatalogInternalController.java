package com.abyssal.catalog.web;

import com.abyssal.catalog.application.CatalogService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/catalog")
@Hidden
public class CatalogInternalController {
  private final CatalogService catalogService;

  public CatalogInternalController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping("/branches/{branchId}")
  public CatalogPayloads.InternalBranchResponse getBranchSnapshot(@PathVariable UUID branchId) {
    return catalogService.getBranchSnapshot(branchId);
  }

  @PostMapping("/menu-items/lookup")
  public Map<String, Object> lookupMenuItems(
    @Valid @RequestBody CatalogPayloads.InternalMenuLookupRequest request
  ) {
    return Map.of("items", catalogService.lookupMenuItems(request.ids()));
  }
}
