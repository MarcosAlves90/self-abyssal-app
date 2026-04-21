import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useCart } from "../context/CartContext";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function DishDetailsScreen({ route, navigation }) {
  const { addItem } = useCart();
  const { item } = route.params;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[item.accentColor || theme.colors.accent, "#091426", "#040b17"]}
        style={styles.hero}
      >
        <Text style={styles.eyebrow}>{getCategoryLabel(item.category)}</Text>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
      </LinearGradient>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Disponibilidade</Text>
        <Text style={styles.sectionCopy}>
          {item.availableForDineIn ? "Atendimento em salao habilitado." : "Nao disponivel em salao."}
        </Text>
        <Text style={styles.sectionCopy}>
          {item.availableForDelivery ? "Pronto para delivery premium." : "Disponivel apenas para consumo local."}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          addItem(item);
          navigation.navigate("MainTabs", {
            screen: "Reserva"
          });
        }}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Adicionar ao carrinho</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  hero: {
    borderRadius: theme.radius.lg,
    minHeight: 320,
    padding: theme.spacing.xl,
    justifyContent: "flex-end"
  },
  eyebrow: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 48,
    marginBottom: 8
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24
  },
  price: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 24,
    marginTop: 18
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 12
  },
  sectionCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    marginTop: theme.spacing.xl,
    minHeight: 54
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  }
});
