package com.abyssal.catalog.application;

import com.abyssal.catalog.config.SeedProperties;
import com.abyssal.catalog.domain.BranchEntity;
import com.abyssal.catalog.domain.MenuCategory;
import com.abyssal.catalog.domain.MenuItemEntity;
import com.abyssal.catalog.repository.BranchRepository;
import com.abyssal.catalog.repository.MenuItemRepository;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class CatalogSeeder implements ApplicationRunner {
  private final SeedProperties seedProperties;
  private final BranchRepository branchRepository;
  private final MenuItemRepository menuItemRepository;

  public CatalogSeeder(
    SeedProperties seedProperties,
    BranchRepository branchRepository,
    MenuItemRepository menuItemRepository
  ) {
    this.seedProperties = seedProperties;
    this.branchRepository = branchRepository;
    this.menuItemRepository = menuItemRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!seedProperties.isEnabled()) {
      return;
    }

    if (branchRepository.count() == 0) {
      branchRepository.saveAll(sampleBranches());
    }

    if (menuItemRepository.count() == 0) {
      menuItemRepository.saveAll(sampleMenuItems());
    }
  }

  private List<BranchEntity> sampleBranches() {
    return List.of(
      branch("Abyssal Paulista", "abyssal-paulista", "Sao Paulo", "Bela Vista", "Av. Paulista, 1100", "18:00 - 23:30", List.of("Zona Crepuscular", "Zona Mesopelagica", "Zona Abissal")),
      branch("Abyssal Pinheiros", "abyssal-pinheiros", "Sao Paulo", "Pinheiros", "Rua dos Corais, 245", "18:30 - 23:00", List.of("Superficie", "Zona Crepuscular", "Zona Abissal")),
      branch("Abyssal Santos", "abyssal-santos", "Santos", "Ponta da Praia", "Av. do Oceano, 89", "19:00 - 00:00", List.of("Zona Mesopelagica", "Zona Batipelagica", "Zona Abissal"))
    );
  }

  private BranchEntity branch(
    String name,
    String slug,
    String city,
    String neighborhood,
    String addressLine,
    String openHours,
    List<String> reservationDepths
  ) {
    BranchEntity branch = new BranchEntity();
    branch.setName(name);
    branch.setSlug(slug);
    branch.setCity(city);
    branch.setNeighborhood(neighborhood);
    branch.setAddressLine(addressLine);
    branch.setOpenHours(openHours);
    branch.setReservationDepths(reservationDepths);
    return branch;
  }

  private List<MenuItemEntity> sampleMenuItems() {
    return List.of(
      menuItem("Ostra Neon", "ostra-neon", MenuCategory.ENTRADAS, 4200, true, "ostra", true, true, "#31e7ff"),
      menuItem("Ceviche de Lulas Prismatica", "ceviche-lulas-prismatica", MenuCategory.ENTRADAS, 4800, true, "lulas", false, true, "#8df9ff"),
      menuItem("Bao de Camarao Fantasma", "bao-camarao-fantasma", MenuCategory.ENTRADAS, 3600, false, "bao", true, true, "#1ad1c9"),
      menuItem("Tartare de Atum Obscuro", "tartare-atum-obscuro", MenuCategory.ENTRADAS, 5100, false, "atum", false, true, "#7ae1ff"),
      menuItem("Lagosta Bioluminescente", "lagosta-bioluminescente", MenuCategory.PRINCIPAIS, 12900, true, "lagosta", true, true, "#31e7ff"),
      menuItem("Risoto de Polvo Ink", "risoto-polvo-ink", MenuCategory.PRINCIPAIS, 7600, true, "polvo", true, true, "#8df9ff"),
      menuItem("Bacalhau das Correntes Frias", "bacalhau-correntes-frias", MenuCategory.PRINCIPAIS, 8400, false, "bacalhau", true, true, "#1ad1c9"),
      menuItem("Arroz Negro com Vieiras", "arroz-negro-vieiras", MenuCategory.PRINCIPAIS, 9300, false, "vieiras", true, true, "#7ae1ff"),
      menuItem("Ramen de Mariscos Abissal", "ramen-mariscos-abissal", MenuCategory.PRINCIPAIS, 6700, false, "ramen", true, true, "#31e7ff"),
      menuItem("Brioche de Caranguejo Azul", "brioche-caranguejo-azul", MenuCategory.PRINCIPAIS, 5900, false, "caranguejo", true, true, "#8df9ff"),
      menuItem("Mousse de Algas Doces", "mousse-algas-doces", MenuCategory.SOBREMESAS, 2900, false, "mousse", true, true, "#1ad1c9"),
      menuItem("Torta Lua de Perola", "torta-lua-de-perola", MenuCategory.SOBREMESAS, 3400, true, "torta", true, true, "#7ae1ff"),
      menuItem("Pudim de Sal Marinho", "pudim-sal-marinho", MenuCategory.SOBREMESAS, 2700, false, "pudim", true, true, "#31e7ff"),
      menuItem("Elixir de Plancton", "elixir-de-plancton", MenuCategory.BEBIDAS, 2200, true, "drink", true, true, "#8df9ff"),
      menuItem("Soda de Agua-Viva", "soda-de-agua-viva", MenuCategory.BEBIDAS, 1800, false, "soda", true, true, "#1ad1c9")
    );
  }

  private MenuItemEntity menuItem(
    String name,
    String slug,
    MenuCategory category,
    int priceCents,
    boolean featured,
    String imageHint,
    boolean availableForDelivery,
    boolean availableForDineIn,
    String accentColor
  ) {
    MenuItemEntity menuItem = new MenuItemEntity();
    menuItem.setName(name);
    menuItem.setSlug(slug);
    menuItem.setCategory(category);
    menuItem.setPriceCents(priceCents);
    menuItem.setFeatured(featured);
    menuItem.setImageHint(imageHint);
    menuItem.setAvailableForDelivery(availableForDelivery);
    menuItem.setAvailableForDineIn(availableForDineIn);
    menuItem.setAccentColor(accentColor);
    menuItem.setDescription("Composicao autoral com ingredientes do mar, finalizacao delicada e contraste luminoso inspirado na experiencia abissal.");
    return menuItem;
  }
}
