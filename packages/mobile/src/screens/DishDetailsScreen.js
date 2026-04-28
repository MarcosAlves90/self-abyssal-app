import React from "react";
import PropTypes from "prop-types";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useCart } from "../context/CartContext";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

function getExperienceNotes(item) {
  const notes = [];

  if (item.availableForDineIn) {
    notes.push(
      "Perfeito para viver no salão, com ritmo e apresentação completos.",
    );
  }

  if (item.availableForDelivery) {
    notes.push(
      "Funciona muito bem para levar a experiência para casa sem perder presença.",
    );
  }

  if (!notes.length) {
    notes.push("Uma escolha especial da casa, pensada para o momento certo.");
  }

  return notes;
}

function getServicePills(item) {
  return [
    {
      label: item.availableForDineIn ? "Salão" : "Não indicado para salão",
      tone: item.availableForDineIn ? styles.pillPositive : styles.pillNeutral,
    },
    {
      label: item.availableForDelivery ? "Delivery" : "Somente na casa",
      tone: item.availableForDelivery
        ? styles.pillPositive
        : styles.pillNeutral,
    },
  ];
}

function getPresentationLine(item) {
  if (item.imageHint) {
    return item.imageHint.replaceAll("-", " ").replaceAll("_", " ").trim();
  }

  return item.name;
}

function getHeroHeight(layout) {
  if (layout.isTiny) {
    return 380;
  }

  if (layout.isCompact) {
    return 420;
  }

  return 470;
}

function PremiumDetailHero({ item, layout }) {
  const heroHeight = getHeroHeight(layout);
  const servicePills = getServicePills(item);
  const experienceNotes = getExperienceNotes(item);

  return (
    <View style={[styles.hero, { minHeight: heroHeight }]}>
      {item.imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View
          style={[
            styles.heroFallback,
            { backgroundColor: item.accentColor || theme.colors.surfaceRaised },
          ]}
        />
      )}

      <LinearGradient
        colors={[
          "rgba(4, 11, 23, 0.08)",
          "rgba(4, 11, 23, 0.42)",
          "rgba(4, 11, 23, 0.8)",
          "rgba(4, 11, 23, 0.98)",
        ]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.heroGlow} />

      <View style={styles.heroHeader}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>
            {getCategoryLabel(item.category)}
          </Text>
        </View>
        {item.isFeatured ? <Text style={styles.featuredMark}>★</Text> : null}
      </View>

      <View style={styles.heroContent}>
        <Text style={styles.kicker}>Experiência da casa</Text>
        <Text
          style={[
            styles.title,
            {
              fontSize: layout.heroTitleSize,
              lineHeight: layout.heroTitleLineHeight,
            },
          ]}
        >
          {item.name}
        </Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.serviceRow}>
          {servicePills.map((pill) => (
            <View key={pill.label} style={[styles.servicePill, pill.tone]}>
              <Text style={styles.servicePillText}>{pill.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.priceCluster}>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
          </View>

          <Text style={styles.presentationLine}>
            {getPresentationLine(item)}
          </Text>
        </View>
      </View>

      <View style={styles.heroBottomBand}>
        <Text style={styles.heroBottomCopy}>{experienceNotes[0]}</Text>
      </View>
    </View>
  );
}

function PremiumSection({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

PremiumDetailHero.propTypes = {
  item: PropTypes.shape({
    accentColor: PropTypes.string,
    availableForDelivery: PropTypes.bool,
    availableForDineIn: PropTypes.bool,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageHint: PropTypes.string,
    imageUrl: PropTypes.string,
    isFeatured: PropTypes.bool,
    name: PropTypes.string.isRequired,
    priceCents: PropTypes.number.isRequired,
  }).isRequired,
  layout: PropTypes.shape({
    heroTitleLineHeight: PropTypes.number.isRequired,
    heroTitleSize: PropTypes.number.isRequired,
    isCompact: PropTypes.bool.isRequired,
    isTiny: PropTypes.bool.isRequired,
  }).isRequired,
};

PremiumSection.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

export function DishDetailsScreen({ route, navigation }) {
  const { addItem } = useCart();
  const { item } = route.params;
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <PremiumDetailHero item={item} layout={layout} />

        <PremiumSection title="O que esperar">
          <Text style={styles.sectionLead}>
            Uma leitura curta, visual limpa e foco total na decisão certa. Esta
            tela foi pensada para transmitir valor, atmosfera e segurança antes
            do toque final.
          </Text>
          <View style={styles.benefitList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>
                Imagem dominante para vender a experiência antes do preço.
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>
                Texto direto, sem excesso, para manter o ritmo premium.
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.sectionCopy}>
                CTA único e claro, sem disputar atenção com elementos
                secundários.
              </Text>
            </View>
          </View>
        </PremiumSection>

        <PremiumSection title="Momento ideal">
          <View style={styles.benefitList}>
            {getExperienceNotes(item).map((note) => (
              <View key={note} style={styles.benefitItem}>
                <View style={styles.benefitDot} />
                <Text style={styles.sectionCopy}>{note}</Text>
              </View>
            ))}
          </View>
        </PremiumSection>

        <View style={styles.actionBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Selecionar ${item.name}`}
            onPress={() => {
              addItem(item);
              navigation.navigate("Cart");
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Selecionar prato</Text>
          </Pressable>

          <Text style={styles.actionHint}>
            Vai para o carrinho para finalizar o delivery.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

DishDetailsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      item: PropTypes.shape({
        accentColor: PropTypes.string,
        availableForDelivery: PropTypes.bool,
        availableForDineIn: PropTypes.bool,
        category: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        imageHint: PropTypes.string,
        imageUrl: PropTypes.string,
        isFeatured: PropTypes.bool,
        name: PropTypes.string.isRequired,
        priceCents: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  content: {
    alignItems: "center",
    padding: theme.spacing.lg,
    paddingBottom: theme.overlays.scrollBottomSafeArea,
  },
  shell: {
    width: "100%",
  },
  hero: {
    overflow: "hidden",
    padding: theme.spacing.xl,
    justifyContent: "flex-end",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(141, 249, 255, 0.1)",
    borderWidth: 1,
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlow: {
    backgroundColor: "rgba(141, 249, 255, 0.12)",
    height: 220,
    opacity: 0.22,
    position: "absolute",
    right: -48,
    top: -72,
    width: 220,
  },
  heroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    position: "relative",
    zIndex: 2,
  },
  categoryPill: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.3)",
    borderColor: "rgba(141, 249, 255, 0.14)",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryPillText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  featuredMark: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 28,
    lineHeight: 28,
    textShadowColor: "rgba(141, 249, 255, 0.42)",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 10,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
  },
  kicker: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 10,
  },
  description: {
    color: "rgba(245, 251, 255, 0.86)",
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 620,
  },
  serviceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: theme.spacing.lg,
  },
  servicePill: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillPositive: {
    backgroundColor: "rgba(114, 240, 184, 0.1)",
    borderColor: "rgba(114, 240, 184, 0.22)",
  },
  pillNeutral: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.09)",
  },
  servicePillText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
  },
  heroFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginTop: theme.spacing.xl,
    position: "relative",
    zIndex: 2,
  },
  priceCluster: {
    flexShrink: 1,
  },
  priceLabel: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
  },
  presentationLine: {
    color: "rgba(245, 251, 255, 0.72)",
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  heroBottomBand: {
    borderTopColor: "rgba(141, 249, 255, 0.08)",
    borderTopWidth: 1,
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    position: "relative",
    zIndex: 2,
  },
  heroBottomCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: "rgba(141, 249, 255, 0.08)",
    borderWidth: 1,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 10,
  },
  sectionLead: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  benefitList: {
    gap: 12,
  },
  benefitItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  benefitDot: {
    backgroundColor: theme.colors.accent,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  sectionCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  actionBar: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  actionHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: "center",
  },
});
