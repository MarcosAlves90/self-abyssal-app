/**
 * useAnimations.js
 *
 * Centralized animation hooks for the Abyssal app.
 * All animations stop cleanly on unmount or re-trigger to avoid frozen frames.
 */

import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// ─── Entrance ────────────────────────────────────────────────────────────────

/**
 * Fade + translateY entrance on mount.
 * Returns an animatedStyle object ready to spread into an Animated.View style.
 *
 * @param {object} [options]
 * @param {number} [options.delay=0]
 * @param {number} [options.duration=380]
 * @param {number} [options.fromY=20] - initial Y offset in px
 * @param {number} [options.fromScale=1] - if < 1, adds a scale component
 */
export function useEntranceAnimation({
  delay = 0,
  duration = 380,
  fromY = 20,
  fromScale = 1,
} = {}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const scale = useRef(new Animated.Value(fromScale)).current;
  const animRef = useRef(null);

  useEffect(() => {
    animRef.current?.stop();

    const animations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    if (fromScale !== 1) {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    animRef.current = Animated.parallel(animations);
    animRef.current.start();

    return () => animRef.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = { opacity, transform: [{ translateY }] };
  if (fromScale !== 1) {
    style.transform.push({ scale });
  }

  return style;
}

// ─── Staggered entrance ───────────────────────────────────────────────────────

/**
 * Staggered fade + translateY entrance for lists of N items.
 * Returns an array of animatedStyle objects (one per item).
 *
 * @param {number} count
 * @param {object} [options]
 * @param {number} [options.stagger=90]
 * @param {number} [options.duration=380]
 * @param {number} [options.fromY=20]
 */
export function useStaggeredEntrance(count, { stagger = 90, duration = 380, fromY = 20 } = {}) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(fromY),
    }))
  ).current;
  const animRef = useRef(null);

  useEffect(() => {
    animRef.current?.stop();

    animRef.current = Animated.stagger(
      stagger,
      anims.map(({ opacity, translateY }) =>
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    );
    animRef.current.start();

    return () => animRef.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return anims.map(({ opacity, translateY }) => ({
    opacity,
    transform: [{ translateY }],
  }));
}

// ─── Re-triggerable entrance ──────────────────────────────────────────────────

/**
 * Entrance animation that restarts whenever `trigger` changes.
 * Useful for banners that appear/disappear based on state.
 * Stops cleanly if interrupted.
 *
 * @param {any} trigger - re-runs the animation when this value changes
 * @param {object} [options]
 * @param {number} [options.duration=280]
 * @param {number} [options.fromY=-12]
 */
export function useRetriggerEntrance(trigger, { duration = 280, fromY = -12 } = {}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    animRef.current?.stop();
    opacity.setValue(0);
    translateY.setValue(fromY);

    animRef.current = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration + 30,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animRef.current.start();

    return () => animRef.current?.stop();
  }, [trigger, opacity, translateY, duration, fromY]);

  return { opacity, transform: [{ translateY }] };
}

// ─── Press scale ──────────────────────────────────────────────────────────────

/**
 * Press scale micro-animation for interactive elements.
 * Interrupts previous animation before starting a new one.
 *
 * @param {object} [options]
 * @param {number} [options.toValue=0.97] - scale on press
 * @returns {{ scale: Animated.Value, onPressIn: Function, onPressOut: Function }}
 */
export function usePressScale({ toValue = 0.97 } = {}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animRef = useRef(null);

  function onPressIn() {
    animRef.current?.stop();
    animRef.current = Animated.spring(scale, {
      toValue,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    });
    animRef.current.start();
  }

  function onPressOut() {
    animRef.current?.stop();
    animRef.current = Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    });
    animRef.current.start();
  }

  return { scale, onPressIn, onPressOut };
}

// ─── Pop on change ────────────────────────────────────────────────────────────

/**
 * Spring pop animation that fires whenever `trigger` changes.
 * Cancels any in-progress animation before restarting.
 *
 * @param {any} trigger - watch value
 * @param {object} [options]
 * @param {number} [options.toValue=1.4] - peak scale
 */
export function usePopAnimation(trigger, { toValue = 1.4 } = {}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    animRef.current?.stop();
    animRef.current = Animated.sequence([
      Animated.spring(scale, {
        toValue,
        tension: 300,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
    ]);
    animRef.current.start();

    return () => animRef.current?.stop();
  }, [trigger, scale, toValue]);

  return { scale };
}

// ─── Modal entrance ───────────────────────────────────────────────────────────

/**
 * Spring scale + fade for modal dialogs.
 * Plays when visible=true, resets immediately when visible=false.
 *
 * @param {boolean} visible
 */
export function useModalEntrance(visible) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  useEffect(() => {
    animRef.current?.stop();

    if (visible) {
      animRef.current = Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
      animRef.current.start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }

    return () => animRef.current?.stop();
  }, [visible, scale, opacity]);

  return { scale, opacity };
}
