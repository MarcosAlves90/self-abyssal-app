import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const KeyboardScrollScreen = forwardRef(function KeyboardScrollScreen({
  children,
  style,
  contentContainerStyle,
  centerContent = false,
  extraKeyboardSpace = 28,
  keyboardVerticalOffset = 0
}, ref) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const lastFocusedTargetRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollToTarget = useCallback(
    (target) => {
      if (!target || !scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard) {
        return;
      }

      requestAnimationFrame(() => {
        scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(
          target,
          extraKeyboardSpace,
          true
        );
      });
    },
    [extraKeyboardSpace]
  );

  useImperativeHandle(ref, () => scrollRef.current);

  useEffect(() => {
    const showVisibilityEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideVisibilityEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showVisibilitySubscription = Keyboard.addListener(showVisibilityEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideVisibilitySubscription = Keyboard.addListener(hideVisibilityEvent, () => {
      setIsKeyboardVisible(false);
    });
    const showScrollSubscription = Keyboard.addListener("keyboardDidShow", () => {
      scrollToTarget(
        lastFocusedTargetRef.current || TextInput.State.currentlyFocusedInput?.()
      );
    });

    return () => {
      showVisibilitySubscription.remove();
      hideVisibilitySubscription.remove();
      showScrollSubscription.remove();
    };
  }, [scrollToTarget]);

  function handleFocusCapture(event) {
    lastFocusedTargetRef.current = event.target;

    if (isKeyboardVisible) {
      scrollToTarget(event.target);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={
        Platform.OS === "ios" ? insets.top + keyboardVerticalOffset : 0
      }
      style={styles.flex}
    >
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={[
          styles.content,
          centerContent && !isKeyboardVisible && styles.centerContent,
          contentContainerStyle
        ]}
        contentInsetAdjustmentBehavior="always"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        onFocusCapture={handleFocusCapture}
        showsVerticalScrollIndicator={false}
        style={[styles.flex, style]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  content: {
    flexGrow: 1
  },
  centerContent: {
    justifyContent: "center"
  }
});
