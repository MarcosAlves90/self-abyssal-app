import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { SectionHeader } from "../components/SectionHeader";
import { useCart } from "../context/CartContext";
import {
  createOrder,
  createReservation,
  fetchBranches,
  fetchReservations,
  getApiErrorMessage
} from "../services/api";
import { formatCurrency, theme } from "../theme/tokens";

function nextDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function ReservationScreen() {
  const { clearCart, items, totalCents, updateItemNote, updateItemQuantity } = useCart();
  const [mode, setMode] = useState("reservation");
  const [branches, setBranches] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    deliveryAddress: "",
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

  const selectedBranch =
    branches.find((branch) => branch.id === reservationForm.branchId) || branches[0];

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
      Alert.alert("Reserva confirmada", "Sua mesa foi registrada com sucesso.");
    } catch (error) {
      Alert.alert("Nao foi possivel reservar", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDeliveryOrder() {
    if (!items.length) {
      Alert.alert("Carrinho vazio", "Adicione itens do menu antes de enviar o delivery.");
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
        deliveryAddress: deliveryForm.deliveryAddress,
        contactName: deliveryForm.contactName
      });

      clearCart();
      Alert.alert("Pedido enviado", "O delivery premium entrou na fila da cozinha.");
    } catch (error) {
      Alert.alert("Falha ao enviar pedido", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="BPMN" title="Reserva e delivery" />

      <View style={styles.modeRow}>
        <ModeButton
          active={mode === "reservation"}
          label="Reserva presencial"
          onPress={() => setMode("reservation")}
        />
        <ModeButton
          active={mode === "delivery"}
          label="Delivery"
          onPress={() => setMode("delivery")}
        />
      </View>

      {mode === "reservation" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Agendar mesa</Text>
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

          <View style={styles.dualFieldRow}>
            <Field label="Data">
              <StyledInput
                onChangeText={(value) =>
                  setReservationForm((current) => ({ ...current, date: value }))
                }
                placeholder="2026-05-10"
                value={reservationForm.date}
              />
            </Field>
            <Field label="Horario">
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

          <Field label="Nivel de profundidade">
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

          <Field label="Observacoes">
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
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Fechar pedido delivery</Text>
          {items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartTopRow}>
                  <Text style={styles.cartName}>{item.name}</Text>
                  <Text style={styles.cartPrice}>{formatCurrency(item.priceCents * item.quantity)}</Text>
                </View>
                <View style={styles.quantityRow}>
                  <Pressable
                    onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.quantityValue}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
                <StyledInput
                  onChangeText={(value) => updateItemNote(item.id, value)}
                  placeholder="Observacao opcional do item"
                  value={item.note}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyCopy}>
              Nenhum item no carrinho. Adicione pratos pela aba Menu.
            </Text>
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
          <Field label="Endereco de entrega">
            <StyledInput
              multiline
              onChangeText={(value) =>
                setDeliveryForm((current) => ({
                  ...current,
                  deliveryAddress: value
                }))
              }
              placeholder="Rua, numero, complemento, bairro"
              value={deliveryForm.deliveryAddress}
            />
          </Field>
          <Field label="Pagamento">
            <View style={styles.chipWrap}>
              {[
                ["in_app_card_tokenized", "Cartao tokenizado"],
                ["card_on_delivery", "Cartao na entrega"]
              ].map(([value, label]) => (
                <SelectionChip
                  active={deliveryForm.paymentMethod === value}
                  key={value}
                  label={label}
                  onPress={() =>
                    setDeliveryForm((current) => ({ ...current, paymentMethod: value }))
                  }
                />
              ))}
            </View>
          </Field>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total estimado</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCents)}</Text>
          </View>
          <PrimaryButton
            disabled={isSubmitting}
            label={isSubmitting ? "Enviando..." : "Enviar pedido"}
            onPress={submitDeliveryOrder}
          />
        </View>
      )}

      <SectionHeader eyebrow="Historico" title="Reservas registradas" />
      {reservations.length ? (
        reservations.map((reservation) => (
          <View key={reservation.id} style={styles.historyCard}>
            <Text style={styles.historyTitle}>{reservation.branchName}</Text>
            <Text style={styles.historyMeta}>
              {new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.historyMeta}>
              {reservation.depthLevel} • {reservation.status}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>Suas proximas reservas aparecerao aqui.</Text>
      )}
    </ScrollView>
  );
}

function ModeButton({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
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
    <Pressable onPress={onPress} style={[styles.selectionChip, active && styles.selectionChipActive]}>
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
      style={[styles.input, props.multiline && styles.textarea]}
      {...props}
    />
  );
}

function PrimaryButton({ disabled, label, onPress }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: theme.spacing.lg
  },
  modeButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
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
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 32,
    marginBottom: theme.spacing.lg
  },
  dualFieldRow: {
    flexDirection: "row",
    gap: 12
  },
  field: {
    marginBottom: 16,
    flex: 1
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
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
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
    borderRadius: theme.radius.md,
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
    borderRadius: theme.radius.pill,
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
    borderRadius: theme.radius.md,
    marginBottom: 14,
    padding: theme.spacing.md
  },
  cartTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
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
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  quantityButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
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
  summaryCard: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    marginTop: 6
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
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
    fontSize: 14,
    lineHeight: 21
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  }
});
