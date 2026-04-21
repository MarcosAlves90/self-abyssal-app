import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";

const authModes = {
  login: {
    eyebrow: "Acesso",
    title: "Entre para continuar.",
    subtitle: "Acesse reservas, pedidos e seu perfil com uma única conta.",
    noticeTitle: "Tudo em um só acesso",
    noticeCopy: "Use seu login para consultar reservas, acompanhar pedidos e atualizar seus dados.",
    submitLabel: "Entrar",
    switchLabel: "Ainda não tem conta?",
    switchAction: "Criar agora"
  },
  register: {
    eyebrow: "Cadastro",
    title: "Crie sua conta.",
    subtitle: "Comece com seus dados principais. O endereço pode ser preenchido depois.",
    noticeTitle: "Cadastro rápido",
    noticeCopy: "Nome, e-mail, senha e telefone são suficientes para criar o acesso inicial.",
    submitLabel: "Criar conta",
    switchLabel: "Já tem uma conta?",
    switchAction: "Entrar"
  }
};

export function AuthScreen() {
  const { login, register } = useAuth();
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password
        });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone.trim() || undefined
        });
      }
    } catch (error) {
      Alert.alert("Não foi possível autenticar", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegister = mode === "register";
  const currentMode = authModes[mode];

  return (
    <LinearGradient colors={["#030814", "#05111f", "#0b1e38"]} style={styles.container}>
      <KeyboardScrollScreen contentContainerStyle={styles.content} extraKeyboardSpace={44}>
        <View style={styles.shell}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Acesso do cliente</Text>
            <Text style={styles.brand}>Abyssal</Text>
            <Text style={styles.heroTitle}>Reservas, pedidos e perfil no mesmo lugar.</Text>
            <Text style={styles.heroCopy}>
              Acesse sua conta para acompanhar reservas, pedir novamente e atualizar
              seus dados.
            </Text>
            <View style={styles.featureRow}>
              <FeaturePill label="Reservas" />
              <FeaturePill label="Delivery" />
              <FeaturePill label="Perfil" />
            </View>
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

            <View style={styles.panelHeader}>
              <Text style={styles.panelEyebrow}>{currentMode.eyebrow}</Text>
              <Text style={styles.panelTitle}>{currentMode.title}</Text>
              <Text style={styles.panelCopy}>{currentMode.subtitle}</Text>
            </View>

            {isRegister ? (
              <FormField
                autoCapitalize="words"
                autoComplete="name"
                inputRef={nameInputRef}
                label="Nome"
                onChangeText={(value) => updateField("name", value)}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                placeholder="Seu nome"
                returnKeyType="next"
                textContentType="name"
                value={form.name}
              />
            ) : null}
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              inputRef={emailInputRef}
              keyboardType="email-address"
              label="E-mail"
              onChangeText={(value) => updateField("email", value)}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
                placeholder="voce@abyssal.app"
              returnKeyType="next"
              textContentType="emailAddress"
              value={form.email}
            />
            <FormField
              autoCapitalize="none"
              autoComplete={isRegister ? "new-password" : "password"}
              autoCorrect={false}
              inputRef={passwordInputRef}
              label="Senha"
              onChangeText={(value) => updateField("password", value)}
              onSubmitEditing={() => {
                if (isRegister) {
                  phoneInputRef.current?.focus();
                  return;
                }

                handleSubmit();
              }}
              placeholder="No mínimo 8 caracteres"
              returnKeyType={isRegister ? "next" : "go"}
              secureTextEntry
              textContentType={isRegister ? "newPassword" : "password"}
              value={form.password}
            />
            {isRegister ? (
              <FormField
                autoComplete="tel"
                inputRef={phoneInputRef}
                keyboardType="phone-pad"
                label="Telefone"
                onChangeText={(value) => updateField("phone", value)}
                onSubmitEditing={handleSubmit}
                placeholder="Opcional, para contato"
                returnKeyType="go"
                textContentType="telephoneNumber"
                value={form.phone}
              />
            ) : null}

            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>{currentMode.noticeTitle}</Text>
              <Text style={styles.noticeCopy}>{currentMode.noticeCopy}</Text>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Processando..." : currentMode.submitLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode(isRegister ? "login" : "register")}
              style={styles.switchAction}
            >
              <Text style={styles.switchActionLabel}>{currentMode.switchLabel}</Text>
              <Text style={styles.switchActionLink}>{currentMode.switchAction}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardScrollScreen>
    </LinearGradient>
  );
}

function FeaturePill({ label }) {
  return (
    <View style={styles.featurePill}>
      <Text style={styles.featurePillText}>{label}</Text>
    </View>
  );
}

FeaturePill.propTypes = {
  label: PropTypes.string.isRequired
};

function FormField({ inputRef, label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accentSoft}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

FormField.propTypes = {
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(TextInput) })
  ]),
  label: PropTypes.string.isRequired
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl + 8,
    paddingBottom: 56
  },
  shell: {
    alignSelf: "center",
    maxWidth: 560,
    width: "100%"
  },
  heroCard: {
    backgroundColor: "rgba(6, 17, 31, 0.76)",
    borderColor: "rgba(141, 249, 255, 0.2)",
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
    padding: 24
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  brand: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 60,
    marginBottom: 8
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 10
  },
  heroCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18
  },
  featurePill: {
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: "rgba(49,231,255,0.16)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  featurePillText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  panel: {
    backgroundColor: "rgba(10, 22, 39, 0.96)",
    borderColor: theme.colors.border,
    borderRadius: 30,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  modeRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    marginBottom: 20,
    padding: 6
  },
  modeButton: {
    alignItems: "center",
    flex: 1,
    minHeight: 46,
    justifyContent: "center"
  },
  modeButtonActive: {
    backgroundColor: "rgba(49,231,255,0.16)"
  },
  modeButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  modeButtonTextActive: {
    color: theme.colors.text
  },
  panelHeader: {
    marginBottom: 20
  },
  panelEyebrow: {
    color: theme.colors.accentWarm,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.3,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 8
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
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
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  noticeCard: {
    backgroundColor: "rgba(7, 18, 33, 0.92)",
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginTop: 4,
    padding: 16
  },
  noticeTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    marginBottom: 6
  },
  noticeCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 54
  },
  buttonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  switchAction: {
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    paddingVertical: 4
  },
  switchActionLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  switchActionLink: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  }
});
