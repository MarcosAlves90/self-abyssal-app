import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    defaultAddress: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password
        });
      } else {
        await register(form);
      }
    } catch (error) {
      Alert.alert("Nao foi possivel autenticar", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <LinearGradient colors={["#030814", "#05111f", "#0b1e38"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Seafood Experience</Text>
            <Text style={styles.title}>Abyssal</Text>
            <Text style={styles.subtitle}>
              Reserva imersiva, menu bioluminescente e fluxo de delivery premium em um unico app.
            </Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.modeRow}>
              {["login", "register"].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setMode(value)}
                  style={[
                    styles.modeButton,
                    mode === value && styles.modeButtonActive
                  ]}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === value && styles.modeButtonTextActive
                    ]}
                  >
                    {value === "login" ? "Entrar" : "Criar conta"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isRegister ? (
              <FormField
                label="Nome"
                onChangeText={(value) => updateField("name", value)}
                placeholder="Seu nome"
                value={form.name}
              />
            ) : null}
            <FormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={(value) => updateField("email", value)}
              placeholder="voce@abyssal.app"
              value={form.email}
            />
            <FormField
              label="Senha"
              onChangeText={(value) => updateField("password", value)}
              placeholder="No minimo 8 caracteres"
              secureTextEntry
              value={form.password}
            />
            {isRegister ? (
              <>
                <FormField
                  keyboardType="phone-pad"
                  label="Telefone"
                  onChangeText={(value) => updateField("phone", value)}
                  placeholder="Opcional"
                  value={form.phone}
                />
                <FormField
                  label="Endereco principal"
                  multiline
                  onChangeText={(value) => updateField("defaultAddress", value)}
                  placeholder="Opcional, para delivery"
                  value={form.defaultAddress}
                />
              </>
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Processando..." : isRegister ? "Criar conta" : "Entrar"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function FormField({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, inputProps.multiline && styles.textarea]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.xl
  },
  hero: {
    marginBottom: 34
  },
  eyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 72,
    marginBottom: 8
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24
  },
  panel: {
    backgroundColor: "rgba(10, 22, 39, 0.94)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  modeRow: {
    flexDirection: "row",
    marginBottom: 22
  },
  modeButton: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    flex: 1,
    minHeight: 46,
    justifyContent: "center"
  },
  modeButtonActive: {
    backgroundColor: "rgba(49,231,255,0.15)"
  },
  modeButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  modeButtonTextActive: {
    color: theme.colors.text
  },
  field: {
    marginBottom: 14
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 8
  },
  input: {
    backgroundColor: "#0f1d35",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52
  },
  buttonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  }
});
