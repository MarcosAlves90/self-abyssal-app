import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { AddressFields } from "../components/AddressFields";
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
  hasAddressData,
  isAddressComplete,
  mapSavedAddressToForm,
  normalizePostalCode,
} from "../utils/address";

const paymentOptions = [
  ["in_app_card_tokenized", "Cartao tokenizado"],
  ["card_on_delivery", "Cartao na entrega"],
];

export function DeliveryCheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { clearCart, itemCount, items, totalCents } = useCart();
  const { width } = useWindowDimensions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    contactName: "",
    address: createEmptyAddress(),
    paymentMethod: "in_app_card_tokenized",
  });

  useEffect(() => {
    setDeliveryForm((current) => ({
      ...current,
      contactName: current.contactName || user?.name || "",
      address: hasAddressData(current.address)
        ? current.address
        : mapSavedAddressToForm(user?.savedAddresses?.[0]),
    }));
  }, [user]);

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
    if (!items.length) {
      Alert.alert(
        "Carrinho vazio",
        "Adicione itens do menu antes de enviar o pedido.",
      );
      return;
    }

    if (!deliveryForm.contactName.trim()) {
      Alert.alert("Nome obrigatório", "Informe quem vai receber o pedido.");
      return;
    }

    if (!isAddressComplete(deliveryForm.address)) {
      Alert.alert(
        "Endereço incompleto",
        "Preencha CEP, rua, número, bairro, cidade e UF para concluir o pedido.",
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
          note: item.note,
        })),
        paymentMethod: deliveryForm.paymentMethod,
        deliveryAddress: buildAddressSummary(deliveryForm.address),
        contactName: deliveryForm.contactName.trim(),
      });

      clearCart();
      Alert.alert("Pedido enviado", "Seu pedido foi enviado para a cozinha.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MainTabs", { screen: "Inicio" }),
        },
      ]);
    } catch (error) {
      Alert.alert("Falha ao enviar pedido", getApiErrorMessage(error));
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
        <View style={[styles.panel, layout.isCompact && styles.panelCompact]}>
          <Text style={styles.panelEyebrow}>Delivery</Text>
          <Text
            style={[
              styles.panelTitle,
              {
                fontSize: layout.featureTitleSize,
                lineHeight: layout.featureTitleLineHeight,
              },
            ]}
          >
            Confirme seu pedido.
          </Text>
          <Text style={styles.panelCopy}>
            Revise itens, endereço e pagamento antes de enviar para a cozinha.
          </Text>

          <View style={styles.deliverySummaryRow}>
            <Text style={styles.deliverySummaryLabel}>Itens no carrinho</Text>
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
              <Text style={styles.emptyTitle}>Carrinho vazio.</Text>
              <Text style={styles.emptyCopy}>
                Adicione pratos no menu para continuar.
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
                setDeliveryForm((current) => ({
                  ...current,
                  contactName: value,
                }))
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
                      paymentMethod: value,
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
        </View>
      </View>
    </KeyboardScrollScreen>
  );
}

DeliveryCheckoutScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

function Field({ children, label }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

Field.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
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
    color: theme.colors.accentWarm,
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
    color: theme.colors.accentSoft,
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
  fieldLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 8,
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
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: theme.colors.accent,
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
    backgroundColor: theme.colors.accent,
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
