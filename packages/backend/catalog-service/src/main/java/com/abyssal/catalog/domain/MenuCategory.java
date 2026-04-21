package com.abyssal.catalog.domain;

public enum MenuCategory {
  ENTRADAS("entradas"),
  PRINCIPAIS("principais"),
  SOBREMESAS("sobremesas"),
  BEBIDAS("bebidas");

  private final String apiValue;

  MenuCategory(String apiValue) {
    this.apiValue = apiValue;
  }

  public String getApiValue() {
    return apiValue;
  }

  public static MenuCategory fromApi(String value) {
    for (MenuCategory category : values()) {
      if (category.apiValue.equalsIgnoreCase(value)) {
        return category;
      }
    }

    throw new IllegalArgumentException("Unknown menu category: " + value);
  }
}
