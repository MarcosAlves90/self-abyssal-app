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
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  fetchBranches,
  fetchMenu,
  fetchReservations,
  getApiErrorMessage
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
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
    return <LoadingOverlay label="Mapeando rotas de profundidade..." />;
  }

  const layout = getResponsiveLayout(width);
  const firstName = user?.name?.split(" ")[0] || "Explorador";
  const nextReservation = reservations[0];

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
                Mergulhe, {firstName}.
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

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Reserva")}
          style={styles.highlightCard}
        >
          <Text style={styles.highlightEyebrow}>Próxima experiência</Text>
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
                Nenhuma reserva no radar.
              </Text>
              <Text style={styles.highlightCopy}>
                Abra a aba Reserva e monte sua próxima jornada presencial.
              </Text>
            </>
          )}
        </Pressable>

        <SectionHeader
          actionLabel="Ver menu"
          description="Cards hero inspirados em discovery feeds de apps como Uber Eats: leitura rápida e decisão direta."
          eyebrow="Curadoria"
          onActionPress={() => navigation.navigate("Menu")}
          title="Destaques do oceano"
        />
        <View style={styles.featuredGrid}>
          {featuredItems.map((item) => (
            <Pressable
              accessibilityHint="Abre os detalhes do prato"
              accessibilityLabel={`${item.name}, ${formatCurrency(item.priceCents)}`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => navigation.navigate("DishDetails", { item })}
              style={[styles.featuredCard, layout.isTablet && styles.featuredCardWide]}
            >
              <View style={[styles.featuredTopRow, layout.isTiny && styles.featuredTopRowStack]}>
                <Text style={styles.featuredCategory}>{getCategoryLabel(item.category)}</Text>
                <Text style={styles.featuredPrice}>{formatCurrency(item.priceCents)}</Text>
              </View>
              <Text
                style={[
                  styles.featuredName,
                  {
                    fontSize: layout.featureTitleSize,
                    lineHeight: layout.featureTitleLineHeight
                  }
                ]}
              >
                {item.name}
              </Text>
              <Text numberOfLines={3} style={styles.featuredCopy}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          description="Cada casa agora aparece com mais presença visual, profundidades evidentes e horário logo no topo."
          eyebrow="Presencial"
          title="Filiais e atmosferas"
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
          description="Seu histórico imediato sobe de importância e ajuda você a continuar a jornada."
          eyebrow="Agenda"
          title="Sua próxima imersão"
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
    marginTop: 22
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
  featuredCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    minHeight: 190,
    padding: theme.spacing.lg,
    width: "100%"
  },
  featuredCardWide: {
    width: "48.9%"
  },
  featuredTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  featuredTopRowStack: {
    alignItems: "flex-start",
    gap: 6
  },
  featuredCategory: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  featuredName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  featuredCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  featuredPrice: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
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
