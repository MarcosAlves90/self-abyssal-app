import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AddressFields } from "../components/AddressFields";
import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  createOrder,
  createReservation,
  fetchBranches,
  fetchReservations,
  getApiErrorMessage,
  lookupPostalCode
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, theme } from "../theme/tokens";
import {
  buildAddressSummary,
  createEmptyAddress,
  hasAddressData,
  isAddressComplete,
  mapSavedAddressToForm,
  normalizePostalCode
} from "../utils/address";

const paymentOptions = [
  ["in_app_card_tokenized", "Cartao tokenizado"],
  ["card_on_delivery", "Cartao na entrega"]
];

function nextDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ReservationScreen({ navigation }) {
  const { user } = useAuth();
  const {
    clearCart,
    itemCount,
    items,
    totalCents,
    updateItemNote,
    updateItemQuantity
  } = useCart();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState("reservation");
  const [branches, setBranches] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    branchId: "",
    date: nextDate(),
    time: "20:00",
    guests: "2",
    depthLevel: "",
    specialRequest: ""
  });
  const [deliveryForm, setDeliveryForm] = useState({
    contactName: "",
    address: createEmptyAddress(),
    paymentMethod: "in_app_card_tokenized"
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [nextBranches, nextReservations] = await Promise.all([
          fetchBranches(),
          fetchReservations()
        ]);

        setBranches(nextBranches);
        setReservations(nextReservations);

        if (nextBranches.length && !reservationForm.branchId) {
          setReservationForm((current) => ({
            ...current,
            branchId: nextBranches[0].id,
            depthLevel: nextBranches[0].reservationDepths[0]
          }));
        }
      } catch (error) {
        Alert.alert("Falha ao carregar reservas", getApiErrorMessage(error));
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    setDeliveryForm((current) => ({
      ...current,
      contactName: current.contactName || user?.name || "",
      address: hasAddressData(current.address)
        ? current.address
        : mapSavedAddressToForm(user?.savedAddresses?.[0])
    }));
  }, [user]);

  const layout = getResponsiveLayout(width);
  const selectedBranch =
    branches.find((branch) => branch.id === reservationForm.branchId) || branches[0];
  const nextReservationItem = reservations[0];
  const deliverySummary = buildAddressSummary(deliveryForm.address);
  const selectedPaymentLabel =
    paymentOptions.find(([value]) => value === deliveryForm.paymentMethod)?.[1] ||
    paymentOptions[0][1];
  const reservationSummaryText = itemCount
    ? `${itemCount} itens prontos`
    : "Carrinho vazio";

  function updateDeliveryAddressField(field, value) {
    setDeliveryForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value
      }
    }));
  }

  async function handleDeliveryPostalCodeLookup() {
    if (normalizePostalCode(deliveryForm.address.postalCode).length !== 8) {
      Alert.alert("CEP inválido", "Informe um CEP com 8 dígitos.");
      return;
    }

    setIsLookingUpPostalCode(true);

    try {
      const cepData = await lookupPostalCode(deliveryForm.address.postalCode);
      setDeliveryForm((current) => ({
        ...current,
        address: {
          ...current.address,
          postalCode: cepData.postalCode,
          street: cepData.street || current.address.street,
          neighborhood: cepData.neighborhood || current.address.neighborhood,
          city: cepData.city || current.address.city,
          state: cepData.state || current.address.state,
          complement: current.address.complement || cepData.complement || ""
        }
      }));
    } catch (error) {
      Alert.alert("Falha ao buscar CEP", error.message);
    } finally {
      setIsLookingUpPostalCode(false);
    }
  }

  async function submitReservation() {
    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(
        `${reservationForm.date}T${reservationForm.time}:00`
      ).toISOString();

      const createdReservation = await createReservation({
        branchId: reservationForm.branchId,
        scheduledAt,
        guests: Number(reservationForm.guests),
        depthLevel: reservationForm.depthLevel,
        specialRequest: reservationForm.specialRequest
      });

      setReservations((current) => [createdReservation, ...current]);
      Alert.alert("Reserva confirmada", "Sua reserva foi registrada com sucesso.");
    } catch (error) {
      Alert.alert("Não foi possível reservar", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDeliveryOrder() {
    if (!items.length) {
      Alert.alert("Carrinho vazio", "Adicione itens do menu antes de enviar o pedido.");
      return;
    }

    if (!deliveryForm.contactName.trim()) {
      Alert.alert("Nome obrigatório", "Informe quem vai receber o pedido.");
      return;
    }

    if (!isAddressComplete(deliveryForm.address)) {
      Alert.alert(
        "Endereço incompleto",
        "Preencha CEP, rua, número, bairro, cidade e UF para concluir o pedido."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrder({
        fulfillmentType: "delivery",
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          note: item.note
        })),
        paymentMethod: deliveryForm.paymentMethod,
        deliveryAddress: buildAddressSummary(deliveryForm.address),
        contactName: deliveryForm.contactName.trim()
      });

      clearCart();
      Alert.alert("Pedido enviado", "Seu pedido foi enviado para a cozinha.");
    } catch (error) {
      Alert.alert("Falha ao enviar pedido", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardScrollScreen
      contentContainerStyle={[styles.content, { padding: layout.contentPadding }]}
      extraKeyboardSpace={56}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <LinearGradient
          colors={["#07172b", "#0b203d", "#123558"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, layout.isCompact && styles.heroCompact]}
        >
          <View style={[styles.heroTop, layout.isWide && styles.heroTopWide]}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Reserva e delivery</Text>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    fontSize: layout.heroTitleSize,
                    lineHeight: layout.heroTitleLineHeight
                  }
                ]}
              >
                {mode === "reservation"
                  ? "Reserve sua mesa em poucos passos."
                  : "Finalize seu pedido de entrega."}
              </Text>
              <Text style={styles.heroSubtitle}>
                Preencha os dados principais e acompanhe o resumo no lado direito.
              </Text>
            </View>

            <View style={[styles.heroStats, layout.isCompact && styles.heroStatsCompact]}>
              <HeroStat
                compact={layout.isCompact}
                label="Reservas"
                minWidth={layout.statCardMinWidth}
                value={String(reservations.length)}
              />
              <HeroStat
                compact={layout.isCompact}
                label="Itens"
                minWidth={layout.statCardMinWidth}
                value={String(itemCount)}
              />
              <HeroStat
                compact={layout.isCompact}
                label="Entrega"
                minWidth={layout.statCardMinWidth}
                value={user?.savedAddresses?.[0]?.summary ? "Pronta" : "Pendente"}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.modeRow, layout.isCompact && styles.modeRowStack]}>
          <ModeButton
            active={mode === "reservation"}
            fullWidth={layout.isCompact}
            label="Reserva presencial"
            onPress={() => setMode("reservation")}
          />
          <ModeButton
            active={mode === "delivery"}
            fullWidth={layout.isCompact}
            label="Delivery"
            onPress={() => setMode("delivery")}
          />
        </View>

        <View style={[styles.mainGrid, layout.isWide && styles.mainGridWide]}>
          <View style={styles.primaryColumn}>
            {mode === "reservation" ? (
              <View style={[styles.panel, layout.isCompact && styles.panelCompact]}>
                <Text style={styles.panelEyebrow}>Reserva presencial</Text>
                <Text
                  style={[
                    styles.panelTitle,
                    {
                      fontSize: layout.featureTitleSize,
                      lineHeight: layout.featureTitleLineHeight
                    }
                  ]}
                >
                  Monte sua noite em poucos blocos.
                </Text>
                <Text style={styles.panelCopy}>
                  Filial, horário, convidados e nível aparecem de forma simples.
                </Text>

                <Field label="Filial">
                  <View style={styles.chipWrap}>
                    {branches.map((branch) => (
                      <SelectionChip
                        active={reservationForm.branchId === branch.id}
                        key={branch.id}
                        label={branch.name}
                        onPress={() =>
                          setReservationForm((current) => ({
                            ...current,
                            branchId: branch.id,
                            depthLevel: branch.reservationDepths[0]
                          }))
                        }
                      />
                    ))}
                  </View>
                </Field>

                <View style={[styles.dualFieldRow, layout.isCompact && styles.dualFieldRowStack]}>
                  <Field label="Data">
                    <StyledInput
                      onChangeText={(value) =>
                        setReservationForm((current) => ({ ...current, date: value }))
                      }
                      placeholder="2026-05-10"
                      value={reservationForm.date}
                    />
                  </Field>
                  <Field label="Horário">
                    <StyledInput
                      onChangeText={(value) =>
                        setReservationForm((current) => ({ ...current, time: value }))
                      }
                      placeholder="20:30"
                      value={reservationForm.time}
                    />
                  </Field>
                </View>

                <Field label="Convidados">
                  <StyledInput
                    keyboardType="number-pad"
                    onChangeText={(value) =>
                      setReservationForm((current) => ({ ...current, guests: value }))
                    }
                    value={reservationForm.guests}
                  />
                </Field>

                <Field label="Nível">
                  <View style={styles.chipWrap}>
                    {(selectedBranch?.reservationDepths || []).map((depth) => (
                      <SelectionChip
                        active={reservationForm.depthLevel === depth}
                        key={depth}
                        label={depth}
                        onPress={() =>
                          setReservationForm((current) => ({ ...current, depthLevel: depth }))
                        }
                      />
                    ))}
                  </View>
                </Field>

                <Field label="Observações">
                  <StyledInput
                    multiline
                    onChangeText={(value) =>
                      setReservationForm((current) => ({
                        ...current,
                        specialRequest: value
                      }))
                    }
                    placeholder="Restrições ou pedidos especiais"
                    value={reservationForm.specialRequest}
                  />
                </Field>

                <PrimaryButton
                  disabled={isSubmitting}
                  label={isSubmitting ? "Confirmando..." : "Confirmar reserva"}
                  onPress={submitReservation}
                />
              </View>
            ) : (
              <View style={[styles.panel, layout.isCompact && styles.panelCompact]}>
                <Text style={styles.panelEyebrow}>Delivery</Text>
                <Text
                  style={[
                    styles.panelTitle,
                    {
                      fontSize: layout.featureTitleSize,
                      lineHeight: layout.featureTitleLineHeight
                    }
                  ]}
                >
                  Feche seu pedido com menos etapas.
                </Text>
                <Text style={styles.panelCopy}>
                  A logica ficou mais proxima de apps de checkout: carrinho, contato,
                  endereco e pagamento em ordem natural.
                </Text>

                {items.length ? (
                  items.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={[styles.cartTopRow, layout.isCompact && styles.cartTopRowStack]}>
                        <Text style={styles.cartName}>{item.name}</Text>
                        <Text style={[styles.cartPrice, layout.isCompact && styles.cartPriceStack]}>
                          {formatCurrency(item.priceCents * item.quantity)}
                        </Text>
                      </View>
                      <View style={styles.quantityRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </Pressable>
                        <Text style={styles.quantityValue}>{item.quantity}</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </Pressable>
                      </View>
                      <StyledInput
                        onChangeText={(value) => updateItemNote(item.id, value)}
                        placeholder="Observação opcional do item"
                        value={item.note}
                      />
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Seu carrinho esta vazio.</Text>
                    <Text style={styles.emptyCopy}>
                      Adicione pratos pela aba Menu antes de enviar o pedido.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => navigation.navigate("Menu")}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Ir para o menu</Text>
                    </Pressable>
                  </View>
                )}

                <Field label="Nome para entrega">
                  <StyledInput
                    onChangeText={(value) =>
                      setDeliveryForm((current) => ({ ...current, contactName: value }))
                    }
                    placeholder="Nome do recebedor"
                    value={deliveryForm.contactName}
                  />
                </Field>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Endereço principal</Text>
                  <Text style={styles.infoCardCopy}>
                    {user?.savedAddresses?.[0]?.summary
                      ? "Endereço principal carregado das configurações. Ajuste se necessário."
                      : "Use o CEP para preencher mais rápido e concluir o pedido."}
                  </Text>
                </View>

                <AddressFields
                  address={deliveryForm.address}
                  isLookingUpPostalCode={isLookingUpPostalCode}
                  onChangeField={updateDeliveryAddressField}
                  onLookupPostalCode={handleDeliveryPostalCodeLookup}
                />

                <Field label="Pagamento">
                  <View style={styles.chipWrap}>
                    {paymentOptions.map(([value, label]) => (
                      <SelectionChip
                        active={deliveryForm.paymentMethod === value}
                        key={value}
                        label={label}
                        onPress={() =>
                          setDeliveryForm((current) => ({
                            ...current,
                            paymentMethod: value
                          }))
                        }
                      />
                    ))}
                  </View>
                </Field>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total estimado</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      layout.isCompact && styles.summaryValueCompact
                    ]}
                  >
                    {formatCurrency(totalCents)}
                  </Text>
                  <Text style={styles.summaryAddress}>
                    {deliverySummary ||
                      "Complete o endereço para visualizar o resumo do pedido."}
                  </Text>
                </View>

                <PrimaryButton
                  disabled={isSubmitting}
                  label={isSubmitting ? "Enviando..." : "Enviar pedido"}
                  onPress={submitDeliveryOrder}
                />
              </View>
            )}
          </View>

          <View style={[styles.secondaryColumn, layout.isWide && styles.secondaryColumnWide]}>
            <View style={styles.railCard}>
              <Text style={styles.railEyebrow}>Resumo atual</Text>
              <Text style={styles.railTitle}>
                {mode === "reservation"
                  ? selectedBranch?.name || "Escolha uma filial"
                  : reservationSummaryText}
              </Text>

              {mode === "reservation" ? (
                <>
                  <SideDetail
                    label="Horario"
                    value={`${reservationForm.date} • ${reservationForm.time}`}
                  />
                  <SideDetail label="Convidados" value={`${reservationForm.guests} pessoas`} />
                  <SideDetail
                    label="Nível"
                    value={reservationForm.depthLevel || "Selecione um nível"}
                  />
                </>
              ) : (
                <>
                  <SideDetail label="Pagamento" value={selectedPaymentLabel} />
                  <SideDetail
                    label="Entrega"
                    value={deliverySummary || "Endereco ainda incompleto"}
                  />
                  <SideDetail label="Total" value={formatCurrency(totalCents)} />
                </>
              )}
            </View>

            <View style={styles.railCard}>
              <Text style={styles.railEyebrow}>Acompanhar</Text>
              <Text style={styles.railTitle}>
                {nextReservationItem ? "Próxima reserva confirmada" : "Nenhuma reserva futura"}
              </Text>
              <Text style={styles.railCopy}>
                {nextReservationItem
                  ? `${nextReservationItem.branchName} em ${new Date(
                      nextReservationItem.scheduledAt
                    ).toLocaleString("pt-BR")}.`
                  : "Quando você confirmar uma mesa, o resumo vai aparecer aqui."}
              </Text>
            </View>

            <SectionHeader
              description="As reservas recentes aparecem na lateral quando houver espaço."
              eyebrow="Histórico"
              title="Reservas registradas"
            />
            {reservations.length ? (
              reservations.map((reservation) => (
                <HistoryCard
                  key={reservation.id}
                  meta={new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
                  subtitle={`${reservation.depthLevel} • ${reservation.status}`}
                  title={reservation.branchName}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Suas próximas reservas aparecerão aqui.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </KeyboardScrollScreen>
  );
}

function HeroStat({ compact = false, label, minWidth, value }) {
  return (
    <View
      style={[
        styles.heroStat,
        compact && styles.heroStatCompact,
        { minWidth: compact ? 0 : minWidth }
      ]}
    >
      <Text style={[styles.heroStatValue, compact && styles.heroStatValueCompact]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function ModeButton({ active, fullWidth = false, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.modeButton,
        fullWidth && styles.modeButtonFullWidth,
        active && styles.modeButtonActive
      ]}
    >
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ children, label }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SelectionChip({ active, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.selectionChip, active && styles.selectionChipActive]}
    >
      <Text style={[styles.selectionChipText, active && styles.selectionChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SideDetail({ label, value }) {
  return (
    <View style={styles.sideDetail}>
      <Text style={styles.sideDetailLabel}>{label}</Text>
      <Text style={styles.sideDetailValue}>{value}</Text>
    </View>
  );
}

function StyledInput(props) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      selectionColor={theme.colors.accentSoft}
      style={[styles.input, props.multiline && styles.textarea]}
      {...props}
    />
  );
}

function PrimaryButton({ disabled, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function HistoryCard({ meta, subtitle, title }) {
  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>{title}</Text>
      <Text style={styles.historyMeta}>{meta}</Text>
      <Text style={styles.historyMeta}>{subtitle}</Text>
    </View>
  );
}

ReservationScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

HeroStat.propTypes = {
  compact: PropTypes.bool,
  label: PropTypes.string.isRequired,
  minWidth: PropTypes.number.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

ModeButton.propTypes = {
  active: PropTypes.bool.isRequired,
  fullWidth: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

Field.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired
};

SelectionChip.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

SideDetail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

StyledInput.propTypes = {
  multiline: PropTypes.bool
};

PrimaryButton.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

HistoryCard.propTypes = {
  meta: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
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
    marginBottom: theme.spacing.lg,
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
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  heroStatsCompact: {
    width: "100%"
  },
  heroStat: {
    backgroundColor: "rgba(255,255,255,0.05)",
    minHeight: 96,
    justifyContent: "center",
    minWidth: 136,
    padding: 14
  },
  heroStatCompact: {
    flexBasis: "47%",
    flexGrow: 1
  },
  heroStatValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 32
  },
  heroStatValueCompact: {
    fontSize: 28
  },
  heroStatLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: theme.spacing.lg
  },
  modeRowStack: {
    flexDirection: "column"
  },
  modeButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  modeButtonFullWidth: {
    width: "100%"
  },
  modeButtonActive: {
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: theme.colors.accent
  },
  modeButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    textAlign: "center"
  },
  modeButtonTextActive: {
    color: theme.colors.text
  },
  mainGrid: {
    gap: theme.spacing.lg
  },
  mainGridWide: {
    alignItems: "flex-start",
    flexDirection: "row"
  },
  primaryColumn: {
    flex: 1
  },
  secondaryColumn: {
    gap: theme.spacing.md
  },
  secondaryColumnWide: {
    width: 330
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  panelCompact: {
    padding: theme.spacing.md
  },
  panelEyebrow: {
    color: theme.colors.accentWarm,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 10
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.lg
  },
  dualFieldRow: {
    flexDirection: "row",
    gap: 12
  },
  dualFieldRowStack: {
    flexDirection: "column"
  },
  field: {
    flex: 1,
    marginBottom: 16
  },
  fieldLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 8
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  selectionChip: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14
  },
  selectionChipActive: {
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: theme.colors.accent
  },
  selectionChipText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  selectionChipTextActive: {
    color: theme.colors.text
  },
  input: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 52
  },
  buttonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  cartItem: {
    backgroundColor: theme.colors.backgroundAlt,
    marginBottom: 14,
    padding: theme.spacing.md
  },
  cartTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  cartTopRowStack: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 4
  },
  cartName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    marginRight: 12
  },
  cartPrice: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  cartPriceStack: {
    marginLeft: 0
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    height: 34,
    justifyContent: "center",
    width: 34
  },
  quantityButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18
  },
  quantityValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  emptyState: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    marginBottom: 16,
    padding: 16
  },
  infoCardTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    marginBottom: 6
  },
  infoCardCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  summaryCard: {
    backgroundColor: theme.colors.backgroundAlt,
    marginBottom: 16,
    marginTop: 4,
    padding: theme.spacing.lg
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 6
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  summaryValueCompact: {
    fontSize: 32,
    lineHeight: 36
  },
  summaryAddress: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  railCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  railEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  railTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 10
  },
  railCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  sideDetail: {
    borderTopColor: "rgba(255,255,255,0.05)",
    borderTopWidth: 1,
    paddingTop: 12
  },
  sideDetailLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 4
  },
  sideDetailValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    marginBottom: 12,
    padding: theme.spacing.lg
  },
  historyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 6
  },
  historyMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  }
});
