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
  private static final String ZONA_ABISSAL = "Zona Abissal";
  private static final String ACCENT_BLUE = "#31e7ff";
  private static final String ACCENT_LIGHT_BLUE = "#8df9ff";
  private static final String ACCENT_TEAL = "#1ad1c9";
  private static final String ACCENT_SKY = "#7ae1ff";
  private static final String IMAGE_BASE_URL = "https://res.cloudinary.com/dflvo098t/image/upload";

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
      branch("Abyssal Paulista", "abyssal-paulista", "Sao Paulo", "Bela Vista", "Av. Paulista, 1100", "18:00 - 23:30", List.of("Zona Crepuscular", "Zona Mesopelagica", ZONA_ABISSAL)),
      branch("Abyssal Pinheiros", "abyssal-pinheiros", "Sao Paulo", "Pinheiros", "Rua dos Corais, 245", "18:30 - 23:00", List.of("Superficie", "Zona Crepuscular", ZONA_ABISSAL)),
      branch("Abyssal Santos", "abyssal-santos", "Santos", "Ponta da Praia", "Av. do Oceano, 89", "19:00 - 00:00", List.of("Zona Mesopelagica", "Zona Batipelagica", ZONA_ABISSAL))
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
      menuItem(new MenuItemSeed("Ostra Neon", "ostra-neon", MenuCategory.ENTRADAS, 4200, true, "ostra", true, true, ACCENT_BLUE, imageUrl("v1777411035/ostra-neon_ve7zy8.png"))),
      menuItem(new MenuItemSeed("Ceviche de Lulas Prismatica", "ceviche-lulas-prismatica", MenuCategory.ENTRADAS, 4800, true, "lulas", false, true, ACCENT_LIGHT_BLUE, imageUrl("v1777411032/ceviche-de-lula-prismatica_so2mz7l.png"))),
      menuItem(new MenuItemSeed("Bao de Camarao Fantasma", "bao-camarao-fantasma", MenuCategory.ENTRADAS, 3600, false, "bao", true, true, ACCENT_TEAL, imageUrl("v1777411031/bao-de-camarao-fantasma_qyyica.png"))),
      menuItem(new MenuItemSeed("Tartare de Atum Obscuro", "tartare-atum-obscuro", MenuCategory.ENTRADAS, 5100, false, "atum", false, true, ACCENT_SKY, imageUrl("v1777411040/tartare-de-atum-obscuro_sywz7l.png"))),
      menuItem(new MenuItemSeed("Lagosta Bioluminescente", "lagosta-bioluminescente", MenuCategory.PRINCIPAIS, 12900, true, "lagosta", true, true, ACCENT_BLUE, imageUrl("v1777411034/lagosta-bioluminescente_jm3yho.png"))),
      menuItem(new MenuItemSeed("Risoto de Polvo Ink", "risoto-polvo-ink", MenuCategory.PRINCIPAIS, 7600, true, "polvo", true, true, ACCENT_LIGHT_BLUE, imageUrl("v1777411038/risoto-de-polvo-ink_ssaybc.png"))),
      menuItem(new MenuItemSeed("Bacalhau das Correntes Frias", "bacalhau-correntes-frias", MenuCategory.PRINCIPAIS, 8400, false, "bacalhau", true, true, ACCENT_TEAL, imageUrl("v1777411030/bacalhau-das-correntes-frias_zgrpjx.png"))),
      menuItem(new MenuItemSeed("Arroz Negro com Vieiras", "arroz-negro-vieiras", MenuCategory.PRINCIPAIS, 9300, false, "vieiras", true, true, ACCENT_SKY, imageUrl("v1777411030/arroz-negro-com-vieiras_wrintx.png"))),
      menuItem(new MenuItemSeed("Ramen de Mariscos Abissal", "ramen-mariscos-abissal", MenuCategory.PRINCIPAIS, 6700, false, "ramen", true, true, ACCENT_BLUE, imageUrl("v1777411037/ramen-de-mariscos-abissal_uogw0u.png"))),
      menuItem(new MenuItemSeed("Brioche de Caranguejo Azul", "brioche-caranguejo-azul", MenuCategory.PRINCIPAIS, 5900, false, "caranguejo", true, true, ACCENT_LIGHT_BLUE, imageUrl("v1777411032/brioche-de-carangueijo-azul_nxzyqy.png"))),
      menuItem(new MenuItemSeed("Mousse de Algas Doces", "mousse-algas-doces", MenuCategory.SOBREMESAS, 2900, false, "mousse", true, true, ACCENT_TEAL, imageUrl("v1777411035/mousse-de-algas-doces_nxscnq.png"))),
      menuItem(new MenuItemSeed("Torta Lua de Perola", "torta-lua-de-perola", MenuCategory.SOBREMESAS, 3400, true, "torta", true, true, ACCENT_SKY, imageUrl("v1777411042/torta-de-lula-de-perola_voaw6i.png"))),
      menuItem(new MenuItemSeed("Pudim de Sal Marinho", "pudim-sal-marinho", MenuCategory.SOBREMESAS, 2700, false, "pudim", true, true, ACCENT_BLUE, imageUrl("v1777411038/pudim-de-sal-marinho_c5zt9v.png"))),
      menuItem(new MenuItemSeed("Elixir de Plancton", "elixir-de-plancton", MenuCategory.BEBIDAS, 2200, true, "drink", true, true, ACCENT_LIGHT_BLUE, imageUrl("v1777411033/elixir-de-plancton_wou2tn.png"))),
      menuItem(new MenuItemSeed("Soda de Agua-Viva", "soda-de-agua-viva", MenuCategory.BEBIDAS, 1800, false, "soda", true, true, ACCENT_TEAL, imageUrl("v1777411039/soda-de-agua-viva_humpsf.png")))
    );
  }

  private MenuItemEntity menuItem(MenuItemSeed seed) {
    MenuItemEntity menuItem = new MenuItemEntity();
    menuItem.setName(seed.name());
    menuItem.setSlug(seed.slug());
    menuItem.setCategory(seed.category());
    menuItem.setPriceCents(seed.priceCents());
    menuItem.setFeatured(seed.featured());
    menuItem.setImageHint(seed.imageHint());
    menuItem.setImageUrl(seed.imageUrl());
    menuItem.setAvailableForDelivery(seed.availableForDelivery());
    menuItem.setAvailableForDineIn(seed.availableForDineIn());
    menuItem.setAccentColor(seed.accentColor());
    menuItem.setDescription("Composicao autoral com ingredientes do mar, finalizacao delicada e contraste luminoso inspirado na experiencia abissal.");
    return menuItem;
  }

  private String imageUrl(String path) {
    return IMAGE_BASE_URL + "/" + path;
  }

  private record MenuItemSeed(
    String name,
    String slug,
    MenuCategory category,
    int priceCents,
    boolean featured,
    String imageHint,
    boolean availableForDelivery,
    boolean availableForDineIn,
    String accentColor,
    String imageUrl
  ) {
  }
}
