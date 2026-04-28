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
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  createOrder,
  createReservation,
  fetchBranches,
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
  } = useCart();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState("reservation");
  const [branches, setBranches] = useState([]);
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
        const nextBranches = await fetchBranches();

        setBranches(nextBranches);

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

        await createReservation({
        branchId: reservationForm.branchId,
        scheduledAt,
        guests: Number(reservationForm.guests),
        depthLevel: reservationForm.depthLevel,
        specialRequest: reservationForm.specialRequest
      });

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
              ? "Escolha a mesa e confirme sem ruído."
              : "Finalize seu pedido com a mesma calma."}
          </Text>
          <Text style={styles.heroSubtitle}>
            Uma tela única, mais leve, com o essencial no lugar certo.
          </Text>
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

        <View style={[styles.panel, layout.isCompact && styles.panelCompact]}>
          {mode === "reservation" ? (
            <>
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
                Selecione a unidade e horário.
              </Text>
              <Text style={styles.panelCopy}>
                Mantivemos só o necessário para reservar com calma e sem distração.
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
                  placeholder="Pedido especial, restrição ou preferência"
                  value={reservationForm.specialRequest}
                />
              </Field>

              <PrimaryButton
                disabled={isSubmitting}
                label={isSubmitting ? "Confirmando..." : "Confirmar reserva"}
                onPress={submitReservation}
              />
            </>
          ) : (
            <>
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
                Complete o pedido com o essencial.
              </Text>
              <Text style={styles.panelCopy}>
                Nome, endereço e pagamento aparecem sem blocos desnecessários.
              </Text>

              <View style={styles.deliverySummaryRow}>
                <Text style={styles.deliverySummaryLabel}>Itens no carrinho</Text>
                <Text style={styles.deliverySummaryValue}>{itemCount}</Text>
                <Text style={styles.deliverySummaryDivider}>•</Text>
                <Text style={styles.deliverySummaryLabel}>Total</Text>
                <Text style={styles.deliverySummaryValue}>{formatCurrency(totalCents)}</Text>
              </View>

              {items.length ? (
                <View style={styles.cartPreview}>
                  {items.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.cartPreviewRow}>
                      <Text style={styles.cartPreviewName} numberOfLines={1}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.cartPreviewValue}>
                        {formatCurrency(item.priceCents * item.quantity)}
                      </Text>
                    </View>
                  ))}
                  {items.length > 3 ? (
                    <Text style={styles.cartPreviewMore}>
                      +{items.length - 3} itens adicionais
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Carrinho vazio.</Text>
                  <Text style={styles.emptyCopy}>Adicione pratos no menu para continuar.</Text>
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

              <PrimaryButton
                disabled={isSubmitting}
                label={isSubmitting ? "Enviando..." : "Enviar pedido"}
                onPress={submitDeliveryOrder}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardScrollScreen>
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

ReservationScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
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

StyledInput.propTypes = {
  multiline: PropTypes.bool
};

PrimaryButton.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
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
    marginTop: 8,
    maxWidth: 640
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10
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
  deliverySummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: theme.spacing.md
  },
  deliverySummaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textTransform: "uppercase"
  },
  deliverySummaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  deliverySummaryDivider: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  cartPreview: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md
  },
  cartPreviewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  cartPreviewName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  cartPreviewValue: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  cartPreviewMore: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 10
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
