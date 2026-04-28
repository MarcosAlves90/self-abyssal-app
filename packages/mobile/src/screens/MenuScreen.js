import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { TopHeroCard } from "../components/TopHeroCard";
import { useCart } from "../context/CartContext";
import { fetchMenu, getApiErrorMessage } from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { getCategoryLabel, theme } from "../theme/tokens";

export function MenuScreen({ navigation }) {
  const { addItem } = useCart();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        const nextItems = await fetchMenu();
        setItems(nextItems);
      } catch (error) {
        Alert.alert("Falha ao carregar o menu", getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    loadMenu();
  }, []);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const validFilters = new Set(items.map((item) => item.category));
    if (activeFilter !== "todos" && !validFilters.has(activeFilter)) {
      setActiveFilter("todos");
    }
  }, [activeFilter, items]);

  if (isLoading) {
    return <LoadingOverlay label="Carregando cardápio..." />;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasSearch = normalizedQuery.length > 0;
  const filteredItems =
    activeFilter === "todos"
      ? items
      : items.filter((item) => item.category === activeFilter);
  const visibleItems = normalizedQuery
    ? filteredItems.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : filteredItems;

  const layout = getResponsiveLayout(width);
  const dynamicFilters = [
    "todos",
    ...Array.from(
      new Set(items.map((item) => item.category).filter(Boolean)),
    ),
  ];
  const menuHeaderDescription = "Escolha o prato da casa que melhor combina com o seu momento.";
  const filterButtons = dynamicFilters.map((filter) => {
    const isActive = activeFilter === filter;
    const itemTotal =
      filter === "todos"
        ? items.length
        : items.filter((item) => item.category === filter).length;
    const iconName =
      {
        todos: "silverware-fork-knife",
        entradas: "food-variant",
        principais: "food-steak",
        sobremesas: "ice-cream",
        bebidas: "glass-cocktail"
      }[filter] || "food";

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        key={filter}
        onPress={() => setActiveFilter(filter)}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
      >
        <MaterialCommunityIcons
          color={isActive ? theme.colors.text : theme.colors.textMuted}
          name={iconName}
          size={14}
        />
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {filter === "todos" ? "Todos" : getCategoryLabel(filter)}
        </Text>
        <Text style={[styles.filterCount, isActive && styles.filterCountActive]}>
          {itemTotal}
        </Text>
      </Pressable>
    );
  });
  const menuCards = visibleItems.map((item) => (
    <MenuCard
      item={item}
      key={item.id}
      onAdd={() => addItem(item)}
      onPress={() => navigation.navigate("DishDetails", { item })}
      showAddButton
      style={layout.isTablet ? styles.menuCardWide : null}
    />
  ));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: layout.contentPadding, paddingTop: layout.contentPadding }
        ]}
        style={styles.scroll}
      >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}> 
          <TopHeroCard
            copy={menuHeaderDescription}
            eyebrow="Cardápio"
            iconName="silverware-fork-knife"
            title="Escolha seu prato."
          />

          <View style={styles.filterBar}>
            <View style={styles.searchRow}>
              <MaterialCommunityIcons
                color={theme.colors.textMuted}
                name="magnify"
                size={16}
              />
              <TextInput
                placeholder="Buscar prato"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.filterSearch}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {hasSearch ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <MaterialCommunityIcons
                    color={theme.colors.textMuted}
                    name="close"
                    size={16}
                  />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filterButtons}
            </ScrollView>
          </View>

          {visibleItems.length ? (
            <View style={styles.menuGrid}>{menuCards}</View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum prato aqui.</Text>
              <Text style={styles.emptyCopy}>
                Ajuste a busca ou troque o filtro para continuar explorando.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setSearchQuery("");
                  setActiveFilter("todos");
                }}
                style={styles.emptyAction}
              >
                <Text style={styles.emptyActionText}>Limpar filtros</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

MenuScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scroll: {
    flex: 1
  },
  content: {
    alignItems: "center",
    padding: theme.spacing.lg,
    paddingBottom: theme.overlays.scrollBottomSafeArea
  },
  shell: {
    width: "100%"
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 6
  },
  filterBar: {
    gap: 10,
    marginBottom: theme.spacing.lg
  },
  searchRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12
  },
  clearSearchButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 26,
    minWidth: 26
  },
  filterSearch: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    flex: 1,
    paddingVertical: 10
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12
  },
  filterChipActive: {
    backgroundColor: "rgba(255,217,138,0.12)",
    borderColor: theme.colors.warning
  },
  filterText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  filterTextActive: {
    color: theme.colors.text
  },
  filterCount: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11
  },
  filterCountActive: {
    color: theme.colors.text
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%"
  },
  menuCardWide: {
    width: "48.9%"
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.xl
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,217,138,0.08)",
    borderColor: "rgba(255,217,138,0.16)",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    marginTop: theme.spacing.md,
    paddingHorizontal: 16
  },
  emptyActionText: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
});
