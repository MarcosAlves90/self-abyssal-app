import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { BranchCard } from "../components/BranchCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { SectionHeader } from "../components/SectionHeader";
import { useCart } from "../context/CartContext";
import {
  fetchBranches,
  fetchMenu,
  fetchReservations,
  getApiErrorMessage,
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";

export function HomeScreen({ navigation }) {
  const { itemCount } = useCart();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      try {
        const [nextBranches, nextFeaturedItems, nextReservations] =
          await Promise.all([
            fetchBranches(),
            fetchMenu({ featured: true }),
            fetchReservations(),
          ]);

        if (!isMounted) {
          return;
        }

        setBranches(nextBranches);
        setFeaturedItems(nextFeaturedItems.slice(0, 4));
        setReservations(nextReservations.slice(0, 2));
      } catch (error) {
        if (isMounted) {
          Alert.alert("Falha ao carregar a home", getApiErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingOverlay label="Carregando conteúdo..." />;
  }

  const layout = getResponsiveLayout(width);
  const nextReservation = reservations[0];
  const quickActions = [
    {
      description: itemCount
        ? `${itemCount} itens prontos para seguir.`
        : "Veja os pratos em destaque e monte sua seleção.",
      icon: itemCount ? "cart-outline" : "silverware-fork-knife",
      label: itemCount ? "Finalizar seleção" : "Explorar cardápio",
      onPress: () => navigation.navigate(itemCount ? "Cart" : "Menu"),
    },
    {
      description: "Escolha a mesa ideal em poucos passos.",
      icon: "calendar-month-outline",
      label: "Reservar mesa",
      onPress: () => navigation.navigate("Reserva"),
    },
    {
      description: "Confira unidades, horários e atendimento.",
      icon: "storefront-outline",
      label: "Ver unidades",
      onPress: () => navigation.navigate("Reserva"),
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: layout.contentPadding,
          paddingTop: layout.contentPadding,
        },
      ]}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[
              "rgba(255,217,138,0.08)",
              "rgba(17,35,64,0.96)",
              "rgba(7,18,38,1)",
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroGlow} />
          <View style={styles.heroRow}>
            <View style={styles.heroIconShell}>
              <MaterialCommunityIcons
                color={theme.colors.warning}
                name="waves"
                size={20}
              />
            </View>
            <Text style={styles.heroEyebrow}>Início</Text>
          </View>
          <Text style={styles.heroTitle}>Seu ritual começa aqui.</Text>
          <Text style={styles.heroCopy}>
            Da escolha ao primeiro sabor, tudo flui com mais leveza e intenção.
          </Text>
        </View>

        <SectionHeader
          description="Ações rápidas para seguir sem perder tempo."
          eyebrow="Acesso rápido"
          title="Comece por aqui"
        />
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.label}
              description={action.description}
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
              wide={layout.isTablet && index === 0}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Reserva")}
          style={styles.highlightCard}
        >
          <Text style={styles.highlightEyebrow}>Próxima mesa</Text>
          {nextReservation ? (
            <>
              <Text
                style={[
                  styles.highlightTitle,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight,
                  },
                ]}
              >
                {nextReservation.branchName}
              </Text>
              <Text style={styles.highlightCopy}>
                {new Date(nextReservation.scheduledAt).toLocaleString("pt-BR")}{" "}
                • {nextReservation.depthLevel} • {nextReservation.guests} pessoas
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.highlightTitle,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight,
                  },
                ]}
              >
                Sem reservas agendadas.
              </Text>
              <Text style={styles.highlightCopy}>
                Toque em Reservar mesa para definir a próxima experiência.
              </Text>
            </>
          )}
        </Pressable>

        <SectionHeader
          actionLabel="Ver menu"
          description="Pratos em destaque, prontos para uma decisão rápida."
          eyebrow="Curadoria"
          onActionPress={() => navigation.navigate("Menu")}
          title="Pratos em destaque"
        />
        <View style={styles.featuredGrid}>
          {featuredItems.map((item) => (
            <MenuCard
              item={item}
              key={item.id}
              onPress={() => navigation.navigate("DishDetails", { item })}
              style={layout.isTablet ? styles.featuredCardWide : null}
            />
          ))}
        </View>

        <SectionHeader
          description="Unidades organizadas para uma escolha objetiva."
          eyebrow="Presencial"
          title="Unidades e horários"
        />
        <View style={styles.branchGrid}>
          {branches.map((branch) => (
            <BranchCard
              branch={branch}
              compact={layout.isWide}
              key={branch.id}
              style={layout.isWide ? styles.branchCardWide : null}
            />
          ))}
        </View>

        <SectionHeader
          description="As próximas reservas aparecem em formato resumido."
          eyebrow="Agenda"
          title="Suas próximas reservas"
        />
        <View style={styles.reservationGrid}>
          {reservations.length ? (
            reservations.map((reservation) => (
              <View
                key={reservation.id}
                style={[
                  styles.reservationCard,
                  layout.isTablet && styles.reservationCardWide,
                ]}
              >
                <Text style={styles.reservationBranch}>
                  {reservation.branchName}
                </Text>
                <Text style={styles.reservationMeta}>
                  {new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
                </Text>
                <Text style={styles.reservationMeta}>
                  {reservation.depthLevel} • {reservation.guests} pessoas
                </Text>
              </View>
            ))
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Reserva")}
              style={styles.emptyCard}
            >
              <Text style={styles.emptyTitle}>
                Nenhuma reserva registrada ainda.
              </Text>
              <Text style={styles.emptyCopy}>
                Use a aba Reserva para agendar sua primeira mesa.
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function QuickActionCard({ description, icon, label, onPress, wide }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.quickActionCard, wide && styles.quickActionCardWide]}
    >
      <View style={styles.quickActionHeader}>
        <MaterialCommunityIcons
          color={theme.colors.warning}
          name={icon}
          size={18}
        />
        <Text style={styles.quickActionLabel}>{label}</Text>
      </View>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </Pressable>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

QuickActionCard.propTypes = {
  description: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  wide: PropTypes.bool,
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
  heroCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.14)",
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.lg,
    position: "relative",
  },
  heroGlow: {
    backgroundColor: "rgba(255,217,138,0.16)",
    height: 180,
    opacity: 0.18,
    position: "absolute",
    right: -40,
    top: -40,
    width: 180,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    position: "relative",
    zIndex: 1,
  },
  heroIconShell: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.24)",
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  heroEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
    position: "relative",
    zIndex: 1,
  },
  heroCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    position: "relative",
    zIndex: 1,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: theme.spacing.lg,
    marginTop: 2,
  },
  quickActionCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.12)",
    borderWidth: 1,
    padding: 12,
    width: "100%",
  },
  quickActionCardWide: {
    width: "31.9%",
  },
  quickActionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  quickActionLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    marginBottom: 0,
  },
  quickActionDescription: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  highlightCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.14)",
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  highlightEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  highlightTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8,
  },
  highlightCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  featuredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: theme.spacing.xl,
  },
  featuredCardWide: {
    width: "48.9%",
  },
  branchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: theme.spacing.xl,
  },
  branchCardWide: {
    width: "48.9%",
  },
  reservationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  reservationCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.1)",
    borderWidth: 1,
    padding: theme.spacing.lg,
    width: "100%",
  },
  reservationCardWide: {
    width: "48.9%",
  },
  reservationBranch: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    marginBottom: 6,
  },
  reservationMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg,
    width: "100%",
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    marginBottom: 8,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
