import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";

import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";
import { formatPostalCode } from "../utils/address";

export function AddressFields({
  address,
  isLookingUpPostalCode,
  onChangeField,
  onLookupPostalCode
}) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const isCompact = width < 520;
  const shouldStackPostalCode = width < 560;

  return (
    <View style={styles.container}>
      <Field label="CEP">
        <View style={[styles.cepRow, shouldStackPostalCode && styles.cepRowStack]}>
          <TextInput
            keyboardType="number-pad"
            maxLength={9}
            onChangeText={(value) => onChangeField("postalCode", formatPostalCode(value))}
            placeholder="00000-000"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.cepInput]}
            value={address.postalCode}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isLookingUpPostalCode}
            onPress={onLookupPostalCode}
            style={[
              styles.lookupButton,
              shouldStackPostalCode && styles.lookupButtonStacked,
              isLookingUpPostalCode && styles.lookupButtonDisabled
            ]}
          >
            {isLookingUpPostalCode ? (
              <ActivityIndicator color={theme.colors.background} size="small" />
            ) : (
              <Text
                style={[
                  styles.lookupButtonText,
                  layout.isTiny && styles.lookupButtonTextCompact
                ]}
              >
                Buscar CEP
              </Text>
            )}
          </Pressable>
        </View>
      </Field>

      <View style={[styles.row, isCompact && styles.rowStack]}>
        <Field label="Rua" style={styles.grow}>
          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => onChangeField("street", value)}
            placeholder="Logradouro"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={address.street}
          />
        </Field>
        <Field label="Numero" style={[styles.numberField, isCompact && styles.fullWidthField]}>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(value) => onChangeField("number", value)}
            placeholder="123"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={address.number}
          />
        </Field>
      </View>

      <Field label="Complemento">
        <TextInput
          autoCapitalize="words"
          onChangeText={(value) => onChangeField("complement", value)}
          placeholder="Apartamento, bloco, referencia"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={address.complement}
        />
      </Field>

      <Field label="Bairro">
        <TextInput
          autoCapitalize="words"
          onChangeText={(value) => onChangeField("neighborhood", value)}
          placeholder="Bairro"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={address.neighborhood}
        />
      </Field>

      <View style={[styles.row, isCompact && styles.rowStack]}>
        <Field label="Cidade" style={styles.grow}>
          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => onChangeField("city", value)}
            placeholder="Cidade"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={address.city}
          />
        </Field>
        <Field label="UF" style={[styles.stateField, isCompact && styles.fullWidthField]}>
          <TextInput
            autoCapitalize="characters"
            maxLength={2}
            onChangeText={(value) => onChangeField("state", value.toUpperCase())}
            placeholder="SP"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={address.state}
          />
        </Field>
      </View>
    </View>
  );
}

function Field({ children, label, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  field: {
    flex: 1
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 8
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
  cepRow: {
    flexDirection: "row",
    gap: 10
  },
  cepRowStack: {
    flexDirection: "column"
  },
  cepInput: {
    flex: 1
  },
  lookupButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 116,
    paddingHorizontal: 14
  },
  lookupButtonStacked: {
    minWidth: 0,
    width: "100%"
  },
  lookupButtonDisabled: {
    opacity: 0.7
  },
  lookupButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  lookupButtonTextCompact: {
    fontSize: 12
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  rowStack: {
    flexDirection: "column"
  },
  grow: {
    flex: 1
  },
  fullWidthField: {
    maxWidth: "100%"
  },
  numberField: {
    maxWidth: 110
  },
  stateField: {
    maxWidth: 90
  }
});
