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
import { BranchCard } from "../components/BranchCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { MenuCard } from "../components/MenuCard";
import { SectionHeader } from "../components/SectionHeader";
import { TopHeroCard } from "../components/TopHeroCard";
import {
  fetchBranches,
  fetchMenu,
  fetchReservations,
  isAbortedRequest,
  getApiErrorMessage,
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";
import { useRequestManager } from "../utils/requestManager";

export function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const requestManager = useRequestManager();

  useEffect(() => {
    const controller = requestManager.start("home.load");

    async function loadHome() {
      try {
        const [nextBranches, nextFeaturedItems, nextReservations] =
          await Promise.all([
            fetchBranches({ signal: controller.signal }),
            fetchMenu({ featured: true }, { signal: controller.signal }),
            fetchReservations({ signal: controller.signal }),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setBranches(nextBranches);
        setFeaturedItems(nextFeaturedItems.slice(0, 4));
        setReservations(nextReservations.slice(0, 2));
      } catch (error) {
        if (!isAbortedRequest(error) && !controller.signal.aborted) {
          Alert.alert("Falha ao carregar a home", getApiErrorMessage(error));
        }
      } finally {
        requestManager.finish("home.load", controller);
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadHome();
  }, [requestManager]);

  if (isLoading) {
    return <LoadingOverlay label="Carregando conteúdo..." />;
  }

  const layout = getResponsiveLayout(width);
  const nextReservation = reservations[0];
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
        <TopHeroCard
          copy="Da escolha ao primeiro sabor, tudo flui com mais leveza e intenção."
          eyebrow="Início"
          iconName="waves"
          title="Seu ritual começa aqui."
        />


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

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
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
