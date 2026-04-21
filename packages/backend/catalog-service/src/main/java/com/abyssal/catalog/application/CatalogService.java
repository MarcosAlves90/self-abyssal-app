package com.abyssal.catalog.application;

import com.abyssal.catalog.domain.BranchEntity;
import com.abyssal.catalog.domain.MenuCategory;
import com.abyssal.catalog.domain.MenuItemEntity;
import com.abyssal.catalog.repository.BranchRepository;
import com.abyssal.catalog.repository.MenuItemRepository;
import com.abyssal.catalog.web.CatalogPayloads;
import com.abyssal.shared.error.ApiException;
import com.abyssal.shared.security.JwtService;
import io.jsonwebtoken.JwtException;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CatalogService {
  private final BranchRepository branchRepository;
  private final MenuItemRepository menuItemRepository;
  private final JwtService jwtService;

  public CatalogService(
    BranchRepository branchRepository,
    MenuItemRepository menuItemRepository,
    JwtService jwtService
  ) {
    this.branchRepository = branchRepository;
    this.menuItemRepository = menuItemRepository;
    this.jwtService = jwtService;
  }

  public void assertAdministrator(String authorizationHeader) {
    if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication token is required.");
    }

    String token = authorizationHeader.substring(7).trim();

    try {
      String role = jwtService.parse(token).role();

      if (!"ADMIN".equalsIgnoreCase(role)) {
        throw new ApiException(HttpStatus.FORBIDDEN, "Administrator access is required.");
      }
    } catch (JwtException | IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid authentication token.");
    }
  }

  @Transactional(readOnly = true)
  public List<CatalogPayloads.BranchResponse> listBranches(String city) {
    return branchRepository.findAll(Sort.by("city", "name")).stream()
      .filter(branch -> !StringUtils.hasText(city) || branch.getCity().equalsIgnoreCase(city.trim()) || branch.getCity().toLowerCase().contains(city.trim().toLowerCase()))
      .map(this::toBranchResponse)
      .toList();
  }

  @Transactional(readOnly = true)
  public CatalogPayloads.BranchResponse getBranch(UUID branchId) {
    return toBranchResponse(findBranch(branchId));
  }

  @Transactional
  public CatalogPayloads.BranchResponse createBranch(CatalogPayloads.BranchUpsertRequest request) {
    BranchEntity branch = new BranchEntity();
    applyBranchRequest(branch, request);
    return toBranchResponse(branchRepository.save(branch));
  }

  @Transactional
  public CatalogPayloads.BranchResponse updateBranch(UUID branchId, CatalogPayloads.BranchUpdateRequest request) {
    if (!request.hasAnyField()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one branch field must be provided.");
    }

    BranchEntity branch = findBranch(branchId);
    applyIfPresent(request.name(), branch::setName);
    applyIfPresent(request.slug(), branch::setSlug);
    applyIfPresent(request.city(), branch::setCity);
    applyIfPresent(request.neighborhood(), branch::setNeighborhood);
    applyIfPresent(request.addressLine(), branch::setAddressLine);
    applyIfPresent(request.openHours(), branch::setOpenHours);

    if (request.reservationDepths() != null) {
      branch.setReservationDepths(request.reservationDepths().stream().map(String::trim).toList());
    }

    return toBranchResponse(branchRepository.save(branch));
  }

  @Transactional
  public void deleteBranch(UUID branchId) {
    BranchEntity branch = findBranch(branchId);
    branchRepository.delete(branch);
  }

  @Transactional(readOnly = true)
  public List<CatalogPayloads.MenuItemResponse> listMenu(String category, Boolean featured) {
    MenuCategory categoryFilter = category == null ? null : parseCategory(category);

    return menuItemRepository.findAll(Sort.by("category", "name")).stream()
      .filter(item -> categoryFilter == null || item.getCategory() == categoryFilter)
      .filter(item -> featured == null || item.isFeatured() == featured)
      .map(this::toMenuItemResponse)
      .toList();
  }

  @Transactional(readOnly = true)
  public CatalogPayloads.MenuItemResponse getMenuItem(UUID menuItemId) {
    return toMenuItemResponse(findMenuItem(menuItemId));
  }

  @Transactional
  public CatalogPayloads.MenuItemResponse createMenuItem(CatalogPayloads.MenuItemUpsertRequest request) {
    MenuItemEntity menuItem = new MenuItemEntity();
    applyMenuItemRequest(menuItem, request);
    return toMenuItemResponse(menuItemRepository.save(menuItem));
  }

  @Transactional
  public CatalogPayloads.MenuItemResponse updateMenuItem(UUID menuItemId, CatalogPayloads.MenuItemUpdateRequest request) {
    if (!request.hasAnyField()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one menu field must be provided.");
    }

    MenuItemEntity menuItem = findMenuItem(menuItemId);
    applyIfPresent(request.name(), menuItem::setName);
    applyIfPresent(request.slug(), menuItem::setSlug);
    applyIfPresent(request.description(), menuItem::setDescription);

    if (request.category() != null) {
      menuItem.setCategory(parseCategory(request.category()));
    }

    if (request.priceCents() != null) {
      menuItem.setPriceCents(request.priceCents());
    }

    if (request.isFeatured() != null) {
      menuItem.setFeatured(request.isFeatured());
    }

    if (request.imageHint() != null) {
      menuItem.setImageHint(trimOrNull(request.imageHint()));
    }

    if (request.availableForDelivery() != null) {
      menuItem.setAvailableForDelivery(request.availableForDelivery());
    }

    if (request.availableForDineIn() != null) {
      menuItem.setAvailableForDineIn(request.availableForDineIn());
    }

    if (request.accentColor() != null) {
      menuItem.setAccentColor(request.accentColor().trim());
    }

    return toMenuItemResponse(menuItemRepository.save(menuItem));
  }

  @Transactional
  public void deleteMenuItem(UUID menuItemId) {
    MenuItemEntity menuItem = findMenuItem(menuItemId);
    menuItemRepository.delete(menuItem);
  }

  @Transactional(readOnly = true)
  public CatalogPayloads.InternalBranchResponse getBranchSnapshot(UUID branchId) {
    BranchEntity branch = findBranch(branchId);
    return new CatalogPayloads.InternalBranchResponse(
      branch.getId().toString(),
      branch.getName(),
      branch.getReservationDepths().stream().sorted().toList()
    );
  }

  @Transactional(readOnly = true)
  public List<CatalogPayloads.InternalMenuItemResponse> lookupMenuItems(Collection<UUID> ids) {
    Map<UUID, MenuItemEntity> menuItems = menuItemRepository.findAllById(ids).stream()
      .collect(Collectors.toMap(MenuItemEntity::getId, item -> item));

    long uniqueIds = ids.stream().distinct().count();

    if (menuItems.size() != uniqueIds) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "One or more menu items are invalid.");
    }

    return ids.stream()
      .map(menuItems::get)
      .map(item -> new CatalogPayloads.InternalMenuItemResponse(
        item.getId().toString(),
        item.getName(),
        item.getPriceCents(),
        item.isAvailableForDelivery(),
        item.isAvailableForDineIn()
      ))
      .toList();
  }

  private BranchEntity findBranch(UUID branchId) {
    return branchRepository.findById(branchId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Branch not found."));
  }

  private MenuItemEntity findMenuItem(UUID menuItemId) {
    return menuItemRepository.findById(menuItemId)
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Menu item not found."));
  }

  private void applyBranchRequest(BranchEntity branch, CatalogPayloads.BranchUpsertRequest request) {
    branch.setName(request.name().trim());
    branch.setSlug(request.slug().trim());
    branch.setCity(request.city().trim());
    branch.setNeighborhood(request.neighborhood().trim());
    branch.setAddressLine(request.addressLine().trim());
    branch.setOpenHours(request.openHours().trim());
    branch.setReservationDepths(request.reservationDepths().stream().map(String::trim).sorted().toList());
  }

  private void applyMenuItemRequest(MenuItemEntity menuItem, CatalogPayloads.MenuItemUpsertRequest request) {
    menuItem.setName(request.name().trim());
    menuItem.setSlug(request.slug().trim());
    menuItem.setDescription(request.description().trim());
    menuItem.setCategory(parseCategory(request.category()));
    menuItem.setPriceCents(request.priceCents());
    menuItem.setFeatured(Boolean.TRUE.equals(request.isFeatured()));
    menuItem.setImageHint(trimOrNull(request.imageHint()));
    menuItem.setAvailableForDelivery(request.availableForDelivery() == null || request.availableForDelivery());
    menuItem.setAvailableForDineIn(request.availableForDineIn() == null || request.availableForDineIn());
    menuItem.setAccentColor(request.accentColor() == null ? "#31e7ff" : request.accentColor().trim());
  }

  private CatalogPayloads.BranchResponse toBranchResponse(BranchEntity branch) {
    return new CatalogPayloads.BranchResponse(
      branch.getId().toString(),
      branch.getName(),
      branch.getSlug(),
      branch.getCity(),
      branch.getNeighborhood(),
      branch.getAddressLine(),
      branch.getOpenHours(),
      branch.getReservationDepths().stream().sorted().toList()
    );
  }

  private CatalogPayloads.MenuItemResponse toMenuItemResponse(MenuItemEntity menuItem) {
    return new CatalogPayloads.MenuItemResponse(
      menuItem.getId().toString(),
      menuItem.getName(),
      menuItem.getSlug(),
      menuItem.getDescription(),
      menuItem.getCategory().getApiValue(),
      menuItem.getPriceCents(),
      menuItem.isFeatured(),
      menuItem.getImageHint(),
      menuItem.isAvailableForDelivery(),
      menuItem.isAvailableForDineIn(),
      menuItem.getAccentColor()
    );
  }

  private void applyIfPresent(String value, Consumer<String> consumer) {
    if (value != null) {
      consumer.accept(value.trim());
    }
  }

  private String trimOrNull(String value) {
    return StringUtils.hasText(value) ? value.trim() : null;
  }

  private MenuCategory parseCategory(String value) {
    try {
      return MenuCategory.fromApi(value);
    } catch (IllegalArgumentException exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
  }
}
