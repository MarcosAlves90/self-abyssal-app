import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { CommonActions } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AddressFields } from "../components/AddressFields";
import { FormFieldLabel } from "../components/FormFieldLabel";
import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  createOrder,
  getApiErrorMessage,
  lookupPostalCode,
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, theme } from "../theme/tokens";
import {
  buildAddressSummary,
  createEmptyAddress,
  isAddressComplete,
  mapSavedAddressToForm,
  normalizePostalCode,
} from "../utils/address";

const paymentOptions = [
  ["in_app_card_tokenized", "Cartão tokenizado"],
  ["card_on_delivery", "Cartão na entrega"],
];

export function DeliveryCheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const primaryAddress = user?.savedAddresses?.[0];
  const {
    clearCart,
    itemCount,
    items,
    setCheckoutFeedback,
    totalCents,
  } = useCart();
  const { width } = useWindowDimensions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    contactName: "",
    address: createEmptyAddress(),
    paymentMethod: "in_app_card_tokenized",
  });

  useEffect(() => {
    setDeliveryForm((current) => ({
      ...current,
      contactName: current.contactName || user?.name || "",
      address: primaryAddress
        ? mapSavedAddressToForm(primaryAddress)
        : current.address,
    }));
  }, [primaryAddress, user]);

  const layout = getResponsiveLayout(width);

  function updateDeliveryAddressField(field, value) {
    setDeliveryForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
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
          complement: current.address.complement || cepData.complement || "",
        },
      }));
    } catch (error) {
      Alert.alert("Falha ao buscar CEP", error.message);
    } finally {
      setIsLookingUpPostalCode(false);
    }
  }

  async function submitDeliveryOrder() {
    const shouldUseAddressEditor = !primaryAddress || showAddressEditor;

    if (!items.length) {
      Alert.alert(
        "Seleção vazia",
        "Adicione pratos do menu antes de concluir o pedido.",
      );
      return;
    }

    if (!deliveryForm.contactName.trim()) {
      Alert.alert("Nome obrigatório", "Informe quem vai receber o pedido.");
      return;
    }

    if (shouldUseAddressEditor && !isAddressComplete(deliveryForm.address)) {
      Alert.alert(
        "Endereço incompleto",
        "Preencha CEP, rua, número, bairro, cidade e UF para concluir o pedido.",
      );
      return;
    }

    const deliveryAddress = shouldUseAddressEditor
      ? buildAddressSummary(deliveryForm.address)
      : primaryAddress?.summary;

    setIsSubmitting(true);

    try {
      await createOrder({
        fulfillmentType: "delivery",
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          note: item.note,
        })),
        paymentMethod: deliveryForm.paymentMethod,
        deliveryAddress,
        contactName: deliveryForm.contactName.trim(),
      });

      clearCart();
      const successFeedback = {
        tone: "success",
        title: "Pedido efetuado com sucesso",
        message: "Pedido enviado para a cozinha.",
      };

      setCheckoutFeedback(successFeedback);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "MainTabs",
              params: {
                screen: "Inicio",
              },
            },
          ],
        }),
      );
    } catch (error) {
      const probableReason = getDeliveryFailureReason(error);

      setCheckoutFeedback({
        tone: "error",
        title: "Não foi possível enviar o pedido",
        message: probableReason,
      });

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "MainTabs",
              params: {
                screen: "Inicio",
              },
            },
          ],
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardScrollScreen
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: layout.contentPadding,
          paddingTop: layout.contentPadding,
        },
      ]}
      extraKeyboardSpace={56}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[
              "rgba(255,217,138,0.18)",
              "rgba(17,35,64,0.94)",
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
                name="silverware-fork-knife"
                size={20}
              />
            </View>
            <Text style={styles.heroEyebrow}>Finalização</Text>
          </View>
          <Text style={styles.heroTitle}>Concluir pedido</Text>
          <Text style={styles.heroCopy}>
            Revise a seleção, confirme o endereço e finalize com discrição e
            precisão.
          </Text>
        </View>

        <View style={[styles.panel, layout.isCompact && styles.panelCompact]}>
          <Text style={styles.panelEyebrow}>Mesa pronta</Text>
          <Text
            style={[
              styles.panelTitle,
              {
                fontSize: layout.featureTitleSize,
                lineHeight: layout.featureTitleLineHeight,
              },
            ]}
          >
            Ajuste os detalhes finais.
          </Text>
          <Text style={styles.panelCopy}>
            Revise os pratos, o endereço e a forma de pagamento antes de
            encaminhar para a cozinha.
          </Text>

          {primaryAddress ? (
            <AddressSummaryCard
              onEditAddress={() => setShowAddressEditor(true)}
              primaryAddress={primaryAddress}
            />
          ) : null}

          <View style={styles.deliverySummaryRow}>
            <Text style={styles.deliverySummaryLabel}>Pratos selecionados</Text>
            <Text style={styles.deliverySummaryValue}>{itemCount}</Text>
            <Text style={styles.deliverySummaryDivider}>•</Text>
            <Text style={styles.deliverySummaryLabel}>Total</Text>
            <Text style={styles.deliverySummaryValue}>
              {formatCurrency(totalCents)}
            </Text>
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
              <Text style={styles.emptyTitle}>Seleção vazia.</Text>
              <Text style={styles.emptyCopy}>
                Escolha pratos no menu para continuar a finalização.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Menu")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Ir ao cardápio</Text>
              </Pressable>
            </View>
          )}

          <Field label="Nome para a entrega" required>
            <StyledInput
              onChangeText={(value) =>
                setDeliveryForm((current) => ({
                  ...current,
                  contactName: value,
                }))
              }
              placeholder="Nome de quem vai receber"
              value={deliveryForm.contactName}
            />
          </Field>

          {!primaryAddress || showAddressEditor ? (
            <>
              {primaryAddress ? (
                <Text style={styles.addressEditorEyebrow}>
                  Novo endereço para esta mesa
                </Text>
              ) : null}
              <AddressFields
                address={deliveryForm.address}
                isLookingUpPostalCode={isLookingUpPostalCode}
                onChangeField={updateDeliveryAddressField}
                onLookupPostalCode={handleDeliveryPostalCodeLookup}
              />
              {primaryAddress ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowAddressEditor(false)}
                  style={styles.addressEditorCancelButton}
                >
                  <Text style={styles.addressEditorCancelText}>
                    Usar endereço principal
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          <Field label="Forma de pagamento" required>
            <View style={styles.chipWrap}>
              {paymentOptions.map(([value, label]) => (
                <SelectionChip
                  active={deliveryForm.paymentMethod === value}
                  key={value}
                  label={label}
                  onPress={() =>
                    setDeliveryForm((current) => ({
                      ...current,
                      paymentMethod: value,
                    }))
                  }
                />
              ))}
            </View>
          </Field>

          <PrimaryButton
            disabled={isSubmitting}
            label={isSubmitting ? "Enviando..." : "Concluir pedido"}
            onPress={submitDeliveryOrder}
          />
        </View>
      </View>
    </KeyboardScrollScreen>
  );
}

DeliveryCheckoutScreen.propTypes = {
  navigation: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

AddressSummaryCard.propTypes = {
  onEditAddress: PropTypes.func.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string,
  }),
};

function AddressSummaryCard({ onEditAddress, primaryAddress }) {
  return (
    <View style={styles.addressSummaryCard}>
      <View style={styles.addressSummaryTop}>
        <View style={styles.addressSummaryContent}>
          <View style={styles.addressSummaryTitleRow}>
            <MaterialCommunityIcons
              color={theme.colors.warning}
              name="map-marker-check-outline"
              size={18}
            />
            <Text style={styles.addressSummaryTitle}>
              {primaryAddress?.label || "Endereço principal"}
            </Text>
          </View>
          <Text style={styles.addressSummaryCopy}>
            {primaryAddress?.summary}
          </Text>
        </View>
        <MaterialCommunityIcons
          color={theme.colors.warning}
          name="home-heart"
          size={22}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onEditAddress}
        style={styles.addressSummaryEditButton}
      >
        <MaterialCommunityIcons
          color={theme.colors.warning}
          name="pencil"
          size={16}
        />
        <Text style={styles.addressSummaryEditButtonText}>
          Ajustar endereço
        </Text>
      </Pressable>
    </View>
  );
}

function getDeliveryFailureReason(error) {
  const message = getApiErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("timeout") || normalized.includes("tempo esgotado")) {
    return "O servidor demorou para responder. Verifique sua conexão e tente novamente.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("conex") ||
    normalized.includes("offline")
  ) {
    return "Não conseguimos falar com o servidor agora. Verifique sua internet e tente novamente.";
  }

  if (normalized.includes("inval") || normalized.includes("obrigat")) {
    return "Algum dado do pedido parece inválido. Revise nome, endereço e pagamento.";
  }

  return message || "Não foi possível concluir o pedido neste momento.";
}

function Field({ children, label, required }) {
  return (
    <View style={styles.field}>
      <FormFieldLabel label={label} required={required} />
      {children}
    </View>
  );
}

Field.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

function SelectionChip({ active, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.selectionChip, active && styles.selectionChipActive]}
    >
      <Text
        style={[
          styles.selectionChipText,
          active && styles.selectionChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

SelectionChip.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

function StyledInput(props) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      selectionColor={theme.colors.accentSoft}
      style={styles.input}
      {...props}
    />
  );
}

StyledInput.propTypes = {
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

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

PrimaryButton.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
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
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.lg,
    position: "relative",
  },
  heroGlow: {
    backgroundColor: "rgba(255,217,138,0.18)",
    height: 180,
    opacity: 0.22,
    position: "absolute",
    right: -36,
    top: -36,
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
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  panelCompact: {
    padding: theme.spacing.md,
  },
  panelEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 10,
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  addressSummaryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  addressSummaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  addressSummaryContent: {
    flex: 1,
    gap: 6,
  },
  addressSummaryTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  addressSummaryTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  addressSummaryCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  addressSummaryEditButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  addressSummaryEditButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  addressEditorEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  addressEditorCancelButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  addressEditorCancelText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  deliverySummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  deliverySummaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textTransform: "uppercase",
  },
  deliverySummaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  deliverySummaryDivider: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  cartPreview: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  cartPreviewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cartPreviewName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  cartPreviewValue: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  cartPreviewMore: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 10,
  },
  emptyState: {
    backgroundColor: theme.colors.backgroundAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  field: {
    marginBottom: 16,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectionChip: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  selectionChipActive: {
    backgroundColor: "rgba(255,217,138,0.12)",
    borderColor: theme.colors.warning,
  },
  selectionChipText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  selectionChipTextActive: {
    color: theme.colors.text,
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
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    justifyContent: "center",
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
});
