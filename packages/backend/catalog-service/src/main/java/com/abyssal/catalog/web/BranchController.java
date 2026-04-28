package com.abyssal.catalog.web;

import com.abyssal.catalog.application.CatalogService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/branches")
public class BranchController {
  private static final String BRANCH_KEY = "branch";

  private final CatalogService catalogService;

  public BranchController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public Map<String, Object> listBranches(
    @RequestParam(name = "city", required = false) String city
  ) {
    return Map.of("branches", catalogService.listBranches(city));
  }

  @GetMapping("/{branchId}")
  public Map<String, Object> getBranch(@PathVariable UUID branchId) {
    return Map.of(BRANCH_KEY, catalogService.getBranch(branchId));
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> createBranch(
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @Valid @RequestBody CatalogPayloads.BranchUpsertRequest request
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(Map.of(BRANCH_KEY, catalogService.createBranch(request)));
  }

  @PatchMapping("/{branchId}")
  public Map<String, Object> updateBranch(
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @PathVariable UUID branchId,
    @Valid @RequestBody CatalogPayloads.BranchUpdateRequest request
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    return Map.of(BRANCH_KEY, catalogService.updateBranch(branchId, request));
  }

  @DeleteMapping("/{branchId}")
  public ResponseEntity<Void> deleteBranch(
    @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
    @PathVariable UUID branchId
  ) {
    catalogService.assertAdministrator(authorizationHeader);
    catalogService.deleteBranch(branchId);
    return ResponseEntity.noContent().build();
  }
}
