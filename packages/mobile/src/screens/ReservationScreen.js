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

import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import {
  createReservation,
  fetchBranches,
  getApiErrorMessage,
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";

function nextDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function ReservationScreen() {
  const { width } = useWindowDimensions();
  const [branches, setBranches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    branchId: "",
    date: nextDate(),
    time: "20:00",
    guests: "2",
    depthLevel: "",
    specialRequest: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const nextBranches = await fetchBranches();

        setBranches(nextBranches);

        if (nextBranches.length) {
          setReservationForm((current) => {
            if (current.branchId) {
              return current;
            }

            return {
              ...current,
              branchId: nextBranches[0].id,
              depthLevel: nextBranches[0].reservationDepths[0],
            };
          });
        }
      } catch (error) {
        Alert.alert("Falha ao carregar reservas", getApiErrorMessage(error));
      }
    }

    loadData();
  }, []);

  const layout = getResponsiveLayout(width);
  const selectedBranch =
    branches.find((branch) => branch.id === reservationForm.branchId) ||
    branches[0];

  async function submitReservation() {
    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(
        `${reservationForm.date}T${reservationForm.time}:00`,
      ).toISOString();

      await createReservation({
        branchId: reservationForm.branchId,
        scheduledAt,
        guests: Number(reservationForm.guests),
        depthLevel: reservationForm.depthLevel,
        specialRequest: reservationForm.specialRequest,
      });

      Alert.alert(
        "Reserva confirmada",
        "Sua reserva foi registrada com sucesso.",
      );
    } catch (error) {
      Alert.alert("Não foi possível reservar", getApiErrorMessage(error));
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
          <Text style={styles.panelEyebrow}>Reserva presencial</Text>
          <Text
            style={[
              styles.panelTitle,
              {
                fontSize: layout.featureTitleSize,
                lineHeight: layout.featureTitleLineHeight,
              },
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
                      depthLevel: branch.reservationDepths[0],
                    }))
                  }
                />
              ))}
            </View>
          </Field>

          <View
            style={[
              styles.dualFieldRow,
              layout.isCompact && styles.dualFieldRowStack,
            ]}
          >
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
                    setReservationForm((current) => ({
                      ...current,
                      depthLevel: depth,
                    }))
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
                  specialRequest: value,
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
        </View>
      </View>
    </KeyboardScrollScreen>
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

Field.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

SelectionChip.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

StyledInput.propTypes = {
  keyboardType: PropTypes.string,
  multiline: PropTypes.bool,
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

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
  dualFieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  dualFieldRowStack: {
    flexDirection: "column",
  },
  field: {
    flex: 1,
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
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
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
