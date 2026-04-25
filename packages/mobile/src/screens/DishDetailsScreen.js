import React from "react";
import PropTypes from "prop-types";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useCart } from "../context/CartContext";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function DishDetailsScreen({ route, navigation }) {
  const { addItem } = useCart();
  const { item } = route.params;
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  const availabilityChips = [
    {
      label: item.availableForDineIn ? "Salão disponível" : "Sem salão",
      tone: item.availableForDineIn ? styles.chipSuccess : styles.chipMuted
    },
    {
      label: item.availableForDelivery ? "Delivery disponível" : "Apenas no local",
      tone: item.availableForDelivery ? styles.chipSuccess : styles.chipMuted
    }
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <LinearGradient
          colors={[item.accentColor || theme.colors.accent, "#0a1730", "#040b17"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, layout.isCompact && styles.heroCompact]}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>{getCategoryLabel(item.category)}</Text>
          <Text
            style={[
              styles.title,
              {
                fontSize: layout.heroTitleSize,
                lineHeight: layout.heroTitleLineHeight
              }
            ]}
          >
            {item.name}
          </Text>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.pricePill}>
              <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
            </View>
            <Text style={styles.metaCopy}>Adicione agora e siga direto para finalizar.</Text>
          </View>

          <View style={styles.chipRow}>
            {availabilityChips.map((chip) => (
              <View key={chip.label} style={[styles.chip, chip.tone]}>
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Por que pedir agora</Text>
          <Text style={styles.sectionLead}>
            A página foi encurtada para ajudar na decisão: leitura rápida, preço em destaque e
            uma ação principal bem clara.
          </Text>
          <View style={styles.benefitList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>Entra no carrinho em um toque.</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>Segue para a aba Reserva sem perder o contexto.</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>
                Você vê disponibilidade no salão e no delivery sem procurar em outra tela.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${item.name} ao carrinho por ${formatCurrency(item.priceCents)}`}
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
      </View>
    </ScrollView>
  );
}

DishDetailsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      item: PropTypes.shape({
        accentColor: PropTypes.string,
        availableForDelivery: PropTypes.bool,
        availableForDineIn: PropTypes.bool,
        category: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        priceCents: PropTypes.number.isRequired
      }).isRequired
    }).isRequired
  }).isRequired
};

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
    overflow: "hidden",
    minHeight: 300,
    padding: theme.spacing.xl,
    justifyContent: "flex-end"
  },
  heroCompact: {
    padding: theme.spacing.lg
  },
  heroGlow: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 180,
    opacity: 0.3,
    position: "absolute",
    right: -60,
    top: -60,
    width: 180
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
    color: "rgba(245, 251, 255, 0.82)",
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: theme.spacing.lg
  },
  pricePill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18
  },
  metaCopy: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    minWidth: 180
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: theme.spacing.lg
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipSuccess: {
    backgroundColor: "rgba(114, 240, 184, 0.12)",
    borderColor: "rgba(114, 240, 184, 0.24)"
  },
  chipMuted: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)"
  },
  chipText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  panel: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8
  },
  sectionLead: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.md
  },
  benefitList: {
    gap: 12
  },
  benefitItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10
  },
  benefitDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8
  },
  sectionCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    flex: 1
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accentWarm,
    marginTop: theme.spacing.xl,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  }
});
