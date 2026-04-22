import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
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

import { BranchCard } from "../components/BranchCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { SectionHeader } from "../components/SectionHeader";
import { useCart } from "../context/CartContext";
import {
  fetchBranches,
  fetchMenu,
  fetchReservations,
  getApiErrorMessage
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
    async function loadHome() {
      try {
        const [nextBranches, nextFeaturedItems, nextReservations] = await Promise.all([
          fetchBranches(),
          fetchMenu({ featured: true }),
          fetchReservations()
        ]);

        setBranches(nextBranches);
        setFeaturedItems(nextFeaturedItems.slice(0, 4));
        setReservations(nextReservations.slice(0, 2));
      } catch (error) {
        Alert.alert("Falha ao carregar a home", getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    loadHome();
  }, []);

  if (isLoading) {
    return <LoadingOverlay label="Carregando conteúdo..." />;
  }

  const layout = getResponsiveLayout(width);
  const nextReservation = reservations[0];
  const quickActions = [
    {
      description: itemCount
        ? `${itemCount} itens prontos para finalizar.`
        : "Veja os pratos em destaque e monte o carrinho.",
      label: itemCount ? "Finalizar pedido" : "Explorar cardápio",
      onPress: () => navigation.navigate(itemCount ? "Reserva" : "Menu")
    },
    {
      description: "Escolha data, horário e unidade em poucos passos.",
      label: "Reservar mesa",
      onPress: () => navigation.navigate("Reserva")
    },
    {
      description: "Confira endereço, horários e opções de atendimento.",
      label: "Ver unidades",
      onPress: () => navigation.navigate("Reserva")
    }
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { padding: layout.contentPadding }]}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <LinearGradient
          colors={["#08172c", "#0b203d", "#133053"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, layout.isCompact && styles.heroCompact]}
        >
          <View style={[styles.heroTop, layout.isWide && styles.heroTopWide]}>
            <View style={styles.heroCopyBlock}>
              <Text style={styles.heroEyebrow}>Início</Text>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    fontSize: layout.heroTitleSize,
                    lineHeight: layout.heroTitleLineHeight
                  }
                ]}
              >
                Sua próxima escolha começa aqui.
              </Text>
            </View>

            <View style={[styles.heroMetrics, layout.isCompact && styles.heroMetricsCompact]}>
              <MetricCard
                compact={layout.isCompact}
                label="Carrinho"
                minWidth={layout.statCardMinWidth}
                value={String(itemCount)}
              />
              <MetricCard
                compact={layout.isCompact}
                label="Reservas"
                minWidth={layout.statCardMinWidth}
                value={String(reservations.length)}
              />
            </View>
          </View>
        </LinearGradient>

        <SectionHeader
          actionLabel={itemCount ? `Carrinho • ${itemCount}` : undefined}
          description="Atalhos rápidos para decidir e seguir sem perder tempo."
          eyebrow="Acesso rápido"
          onActionPress={() => navigation.navigate("Reserva")}
          title="Comece por aqui"
        />
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.label}
              description={action.description}
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
          <Text style={styles.highlightEyebrow}>Próxima ação</Text>
          {nextReservation ? (
            <>
              <Text
                style={[
                  styles.highlightTitle,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight
                  }
                ]}
              >
                {nextReservation.branchName}
              </Text>
              <Text style={styles.highlightCopy}>
                {new Date(nextReservation.scheduledAt).toLocaleString("pt-BR")} •{" "}
                {nextReservation.depthLevel} • {nextReservation.guests} pessoas
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.highlightTitle,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight
                  }
                ]}
              >
                Sem reservas agendadas.
              </Text>
              <Text style={styles.highlightCopy}>
                Toque em Reservar mesa para fechar sua próxima visita.
              </Text>
            </>
          )}
        </Pressable>

        <SectionHeader
          actionLabel="Ver menu"
          description="Pratos em destaque para decidir rápido e sem excesso de texto."
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
          description="Unidades organizadas de forma simples para você escolher mais rápido."
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
                style={[styles.reservationCard, layout.isTablet && styles.reservationCardWide]}
              >
                <Text style={styles.reservationBranch}>{reservation.branchName}</Text>
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
              <Text style={styles.emptyTitle}>Nenhuma reserva registrada ainda.</Text>
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

function MetricCard({ compact = false, label, minWidth, value }) {
  return (
    <View
      style={[
        styles.metricCard,
        compact && styles.metricCardCompact,
        { minWidth: compact ? 0 : minWidth }
      ]}
    >
      <Text style={[styles.metricValue, compact && styles.metricValueCompact]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickActionCard({ description, label, onPress, wide }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.quickActionCard, wide && styles.quickActionCardWide]}
    >
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </Pressable>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

MetricCard.propTypes = {
  compact: PropTypes.bool,
  label: PropTypes.string.isRequired,
  minWidth: PropTypes.number.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

QuickActionCard.propTypes = {
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  wide: PropTypes.bool
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
  heroCopyBlock: {
    flex: 1,
    maxWidth: 560
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
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
    marginTop: 8
  },
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  heroMetricsCompact: {
    width: "100%"
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    minHeight: 92,
    justifyContent: "center",
    minWidth: 138,
    padding: 14
  },
  metricCardCompact: {
    flexGrow: 1,
    flexBasis: "47%"
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34
  },
  metricValueCompact: {
    fontSize: 28
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: theme.spacing.xl,
    marginTop: 4
  },
  quickActionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    minHeight: 114,
    padding: 16,
    width: "100%"
  },
  quickActionCardWide: {
    width: "31.9%"
  },
  quickActionLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8
  },
  quickActionDescription: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  highlightCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg
  },
  highlightEyebrow: {
    color: theme.colors.accentWarm,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  highlightTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  highlightCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  featuredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: theme.spacing.xl
  },
  featuredCardWide: {
    width: "48.9%"
  },
  branchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: theme.spacing.xl
  },
  branchCardWide: {
    width: "48.9%"
  },
  reservationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  reservationCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    padding: theme.spacing.lg,
    width: "100%"
  },
  reservationCardWide: {
    width: "48.9%"
  },
  reservationBranch: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    marginBottom: 6
  },
  reservationMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg,
    width: "100%"
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    marginBottom: 8
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  }
});
