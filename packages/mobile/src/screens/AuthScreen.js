import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormFieldLabel } from "../components/FormFieldLabel";
import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { SeaShellIcon } from "../components/icons/SeaShellIcon";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";
import { formatPhoneNumber, normalizePhoneNumber } from "../utils/phone";

const AUTH_BACKGROUND_ASPECT_RATIO = 2500 / 1667;
const AUTH_BACKGROUND_IMAGE = require("../../assets/images/auth/login-hero.png");

const AUTH_MODES = {
  login: {
    eyebrow: "Sua experiência",
    title: "Entre para continuar.",
    subtitle: "Pedidos, reservas e perfil em um só lugar.",
    submitLabel: "Entrar",
    switchLabel: "Ainda não tem conta?",
    switchAction: "Criar agora"
  },
  register: {
    eyebrow: "Comece por aqui",
    title: "Crie sua conta.",
    subtitle: "Leva menos de um minuto para seguir.",
    submitLabel: "Criar conta",
    switchLabel: "Já tem conta?",
    switchAction: "Entrar"
  }
};

function getBackgroundImageStyle(windowHeight) {
  return {
    height: windowHeight,
    width: windowHeight * AUTH_BACKGROUND_ASPECT_RATIO
  };
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
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
  const [feedback, setFeedback] = useState({ tone: "idle", message: "" });

  function updateField(field, value) {
    if (feedback.tone !== "idle") {
      setFeedback({ tone: "idle", message: "" });
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearFeedback() {
    if (feedback.tone !== "idle") {
      setFeedback({ tone: "idle", message: "" });
    }
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    let normalizedPhone = "";

    if (mode === "register") {
      normalizedPhone = normalizePhoneNumber(form.phone);

      if (normalizedPhone.length !== 10 && normalizedPhone.length !== 11) {
        setFeedback({
          tone: "error",
          message: "Informe um telefone válido para concluir o cadastro."
        });
        Alert.alert(
          "Telefone obrigatório",
          "Informe um telefone válido para concluir o cadastro."
        );
        return;
      }
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
          phone: normalizedPhone
        });
      }
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error.message
      });
      Alert.alert("Não foi possível autenticar", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegister = mode === "register";
  const currentMode = AUTH_MODES[mode];

  return (
    <View style={styles.container}>
      <Image
        source={AUTH_BACKGROUND_IMAGE}
        style={[styles.backgroundImage, getBackgroundImageStyle(windowHeight)]}
        resizeMode="contain"
      />
      <LinearGradient
        colors={["rgba(3, 8, 20, 0.88)", "rgba(5, 17, 31, 0.88)", "rgba(11, 30, 56, 0.9)"]}
        style={styles.overlay}
      >
        <KeyboardScrollScreen contentContainerStyle={styles.content} extraKeyboardSpace={44}>
          <View style={styles.shell}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>Abyssal</Text>
              <SeaShellIcon color={theme.colors.text} size={70} style={styles.brandIcon} />
            </View>

            <View style={styles.modeRow}>
              {["login", "register"].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setMode(value);
                    clearFeedback();
                  }}
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
                required
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
              required
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
              required
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
                required
                maxLength={15}
                onChangeText={(value) => updateField("phone", formatPhoneNumber(value))}
                onSubmitEditing={handleSubmit}
                placeholder="Ex.: (11) 98765-4321"
                returnKeyType="go"
                textContentType="telephoneNumber"
                value={form.phone}
              />
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Processando..." : currentMode.submitLabel}
              </Text>
            </Pressable>

            <FeedbackBanner message={feedback.message} tone={feedback.tone} />

            <Pressable
              onPress={() => {
                setMode(isRegister ? "login" : "register");
                clearFeedback();
              }}
              style={styles.switchAction}
            >
              <Text style={styles.switchActionLabel}>{currentMode.switchLabel}</Text>
              <Text style={styles.switchActionLink}>{currentMode.switchAction}</Text>
            </Pressable>

            <Text style={styles.supportCopy}>Sem spam. Seus dados ficam protegidos.</Text>
          </View>
        </KeyboardScrollScreen>
      </LinearGradient>
    </View>
  );
}

function FormField({ inputRef, label, required, ...inputProps }) {
  return (
    <View style={styles.field}>
      <FormFieldLabel label={label} required={required} />
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
  label: PropTypes.string.isRequired,
  required: PropTypes.bool
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden"
  },
  overlay: {
    flex: 1
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    opacity: 0.92,
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
  brandRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 0,
    marginBottom: 18
  },
  brand: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 60,
    textAlign: "center"
  },
  brandIcon: {
    marginTop: 6
  },
  modeRow: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 20,
    padding: 6
  },
  modeButton: {
    alignItems: "center",
    flex: 1,
    borderRadius: theme.radius.pill,
    minHeight: 46,
    justifyContent: "center"
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,217,138,0.16)"
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
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.3,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 8
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 23
  },
  field: {
    marginBottom: 14
  },
  input: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
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
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  supportCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center"
  }
});
