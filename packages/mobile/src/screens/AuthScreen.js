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

import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { SeaShellIcon } from "../components/icons/SeaShellIcon";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";

const AUTH_BACKGROUND_ASPECT_RATIO = 2500 / 1667;
const AUTH_BACKGROUND_IMAGE = require("../../assets/images/auth/login-hero.png");

const AUTH_MODES = {
  login: {
    eyebrow: "Bem-vindo",
    title: "Acesse sua conta.",
    subtitle: "Rápido, seguro e sem ruído.",
    submitLabel: "Entrar",
    switchLabel: "Ainda não tem conta?",
    switchAction: "Criar agora"
  },
  register: {
    eyebrow: "Comece agora",
    title: "Crie sua conta.",
    subtitle: "Leva menos de um minuto.",
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

            <Text style={styles.supportCopy}>Sem spam. Seus dados ficam protegidos.</Text>
          </View>
        </KeyboardScrollScreen>
      </LinearGradient>
    </View>
  );
}

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
    backgroundColor: "rgba(255,255,255,0.04)",
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
    borderWidth: 1,
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
  },
  supportCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center"
  }
});
