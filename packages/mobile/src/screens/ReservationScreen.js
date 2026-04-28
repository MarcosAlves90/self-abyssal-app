import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormFieldLabel } from "../components/FormFieldLabel";
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
  const [confirmation, setConfirmation] = useState(null);
  const [feedback, setFeedback] = useState({ tone: "idle", message: "" });
  const [reservationForm, setReservationForm] = useState({
    branchId: "",
    date: nextDate(),
    time: "20:00",
    guests: "2",
    depthLevel: "",
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
        setFeedback({ tone: "error", message: getApiErrorMessage(error) });
      }
    }

    loadData();
  }, []);

  const layout = getResponsiveLayout(width);
  const selectedBranch =
    branches.find((branch) => branch.id === reservationForm.branchId) ||
    branches[0];

  async function submitReservation() {
    setConfirmation(null);
    setFeedback({ tone: "saving", message: "Confirmando sua reserva..." });
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
      });

      setConfirmation({
        branchName: selectedBranch?.name || "Unidade selecionada",
        guests: Number(reservationForm.guests),
        depthLevel: reservationForm.depthLevel,
        scheduledAt,
      });

      setFeedback({
        tone: "success",
        message: "Reserva confirmada com sucesso.",
      });
    } catch (error) {
      setFeedback({ tone: "error", message: getApiErrorMessage(error) });
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
          <Text
            style={[
              styles.panelTitle,
              {
                fontSize: layout.featureTitleSize,
                lineHeight: layout.featureTitleLineHeight,
              },
            ]}
          >
            Reservar mesa
          </Text>

          <Field icon="storefront-outline" label="Filial" required>
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
            <Field icon="calendar-month-outline" label="Data" required>
              <StyledInput
                onChangeText={(value) =>
                  setReservationForm((current) => ({ ...current, date: value }))
                }
                placeholder="2026-05-10"
                value={reservationForm.date}
              />
            </Field>
            <Field icon="clock-outline" label="Horário" required>
              <StyledInput
                onChangeText={(value) =>
                  setReservationForm((current) => ({ ...current, time: value }))
                }
                placeholder="20:30"
                value={reservationForm.time}
              />
            </Field>
          </View>

          <Field icon="account-group-outline" label="Convidados" required>
            <StyledInput
              keyboardType="number-pad"
              onChangeText={(value) =>
                setReservationForm((current) => ({ ...current, guests: value }))
              }
              value={reservationForm.guests}
            />
          </Field>

          <Field icon="layers-outline" label="Nível" required>
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

          <PrimaryButton
            disabled={isSubmitting}
            label={isSubmitting ? "Confirmando..." : "Confirmar reserva"}
            onPress={submitReservation}
          />

          <FeedbackBanner
            message={feedback.message}
            details={
              feedback.tone === "success" && confirmation ? (
                <View style={styles.confirmationDetails}>
                  <Text style={styles.confirmationDetail}>
                    {confirmation.branchName}
                  </Text>
                  <Text style={styles.confirmationDetail}>
                    {new Date(confirmation.scheduledAt).toLocaleString("pt-BR")}
                  </Text>
                  <Text style={styles.confirmationDetail}>
                    {confirmation.guests} pessoas
                    {confirmation.depthLevel ? ` • ${confirmation.depthLevel}` : ""}
                  </Text>
                </View>
              ) : null
            }
            tone={feedback.tone}
          />
        </View>
      </View>
    </KeyboardScrollScreen>
  );
}

function Field({ children, icon, label, required }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <MaterialCommunityIcons
          color={theme.colors.textMuted}
          name={icon}
          size={16}
        />
        <FormFieldLabel label={label} required={required} style={styles.inlineLabel} />
      </View>
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
      style={styles.input}
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
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !disabled && styles.primaryButtonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <View style={styles.primaryButtonContent}>
        {disabled ? (
          <ActivityIndicator
            color={theme.colors.background}
            size="small"
            style={styles.primaryButtonLoader}
          />
        ) : (
          <MaterialCommunityIcons
            color={theme.colors.background}
            name="check-circle-outline"
            size={18}
          />
        )}
        <Text style={styles.primaryButtonText}>{label}</Text>
      </View>
    </Pressable>
  );
}

Field.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

SelectionChip.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

StyledInput.propTypes = {
  keyboardType: PropTypes.string,
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
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: theme.spacing.md,
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
    marginBottom: 14,
  },
  fieldLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  inlineLabel: {
    marginBottom: 0,
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
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  primaryButtonLoader: {
    width: 18,
  },
  confirmationDetails: {
    gap: 4,
    marginTop: 4,
  },
  confirmationDetail: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
});
