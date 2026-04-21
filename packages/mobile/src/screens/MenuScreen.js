import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { SectionHeader } from "../components/SectionHeader";
import { useCart } from "../context/CartContext";
import { fetchMenu, getApiErrorMessage } from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

const filters = ["todos", "entradas", "principais", "sobremesas", "bebidas"];

export function MenuScreen({ navigation }) {
  const { addItem, itemCount, totalCents } = useCart();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("todos");

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

  if (isLoading) {
    return <LoadingOverlay label="Iluminando o cardapio..." />;
  }

  const visibleItems =
    activeFilter === "todos"
      ? items
      : items.filter((item) => item.category === activeFilter);

  const layout = getResponsiveLayout(width);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { padding: layout.contentPadding }]}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <LinearGradient
          colors={["#08172c", "#0c223c", "#13345b"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, layout.isCompact && styles.heroCompact]}
        >
          <View style={[styles.heroTop, layout.isWide && styles.heroTopWide]}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Cardapio</Text>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    fontSize: layout.heroTitleSize,
                    lineHeight: layout.heroTitleLineHeight
                  }
                ]}
              >
                Escolha como em apps de delivery premium.
              </Text>
              <Text style={styles.heroSubtitle}>
                Filtros evidentes, leitura editorial dos pratos e grid responsivo para
                mobile e web.
              </Text>
            </View>

            <View style={[styles.heroAside, layout.isCompact && styles.heroAsideCompact]}>
              <Text style={styles.heroAsideEyebrow}>
                {itemCount ? "Carrinho ativo" : "Pronto para descobrir"}
              </Text>
              <Text
                style={[
                  styles.heroAsideValue,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight
                  }
                ]}
              >
                {itemCount ? `${itemCount} itens` : `${items.length} pratos`}
              </Text>
              <Text style={styles.heroAsideCopy}>
                {itemCount
                  ? `${itemCount} itens somando ${formatCurrency(totalCents)} aguardam finalizacao na aba Reserva.`
                  : "Filtre por categoria e encontre pratos para salao ou delivery."}
              </Text>
              {itemCount ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("Reserva")}
                  style={[styles.heroAction, layout.isCompact && styles.heroActionCompact]}
                >
                  <Text style={styles.heroActionText}>Abrir carrinho e entrega</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        <SectionHeader
          actionLabel={itemCount ? `Carrinho • ${itemCount}` : undefined}
          description={`Mostrando ${visibleItems.length} pratos no filtro atual.`}
          eyebrow="Filtros"
          onActionPress={() => navigation.navigate("Reserva")}
          title="Encontre no seu ritmo"
        />
        <View style={styles.filters}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            const itemTotal =
              filter === "todos"
                ? items.length
                : items.filter((item) => item.category === filter).length;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter === "todos" ? "Todos" : getCategoryLabel(filter)}
                </Text>
                <Text style={[styles.filterCount, isActive && styles.filterCountActive]}>
                  {itemTotal}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visibleItems.length ? (
          <View style={styles.menuGrid}>
            {visibleItems.map((item) => (
              <MenuCard
                compact={layout.isWide}
                item={item}
                key={item.id}
                onAdd={() => addItem(item)}
                onPress={() => navigation.navigate("DishDetails", { item })}
                style={layout.isWide ? styles.menuCardWide : null}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum prato nesse filtro.</Text>
            <Text style={styles.emptyCopy}>
              Troque a categoria para continuar explorando o cardapio.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    alignItems: "center",
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  shell: {
    width: "100%"
  },
  hero: {
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl
  },
  heroCompact: {
    padding: theme.spacing.lg
  },
  heroTop: {
    gap: 20
  },
  heroTopWide: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroCopy: {
    flex: 1,
    maxWidth: 560
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginTop: 8
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10
  },
  heroAside: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    minWidth: 250,
    padding: theme.spacing.lg
  },
  heroAsideCompact: {
    minWidth: 0,
    width: "100%"
  },
  heroAsideEyebrow: {
    color: theme.colors.accentWarm,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  heroAsideValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  heroAsideCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  heroAction: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 46,
    paddingHorizontal: 16
  },
  heroActionCompact: {
    width: "100%"
  },
  heroActionText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: theme.spacing.lg
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14
  },
  filterChipActive: {
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: theme.colors.accent
  },
  filterText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  filterTextActive: {
    color: theme.colors.text
  },
  filterCount: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  filterCountActive: {
    color: theme.colors.text
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  menuCardWide: {
    width: "48.9%"
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
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
  }
});
