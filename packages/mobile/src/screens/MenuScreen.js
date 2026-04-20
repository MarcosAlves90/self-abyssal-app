import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { SectionHeader } from "../components/SectionHeader";
import { useCart } from "../context/CartContext";
import { fetchMenu, getApiErrorMessage } from "../services/api";
import { getCategoryLabel, theme } from "../theme/tokens";

const filters = ["todos", "entradas", "principais", "sobremesas", "bebidas"];

export function MenuScreen({ navigation }) {
  const { addItem, itemCount } = useCart();
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

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={visibleItems}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <SectionHeader
            eyebrow="Delivery e salao"
            title="Cardapio abissal"
            actionLabel={itemCount ? `${itemCount} no carrinho` : undefined}
            onActionPress={() => navigation.navigate("Reserva")}
          />
          <View style={styles.filters}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {filter === "todos" ? "Todos" : getCategoryLabel(filter)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <MenuCard
          item={item}
          onAdd={() => addItem(item)}
          onPress={() => navigation.navigate("DishDetails", { item })}
        />
      )}
      style={styles.screen}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: theme.spacing.lg
  },
  filterChip: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
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
  }
});
