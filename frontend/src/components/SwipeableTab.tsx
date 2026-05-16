/**
 * SwipeableTab — wraps a tab screen and lets the user swipe horizontally
 * between sibling tabs (Today ↔ Apps ↔ Stats ↔ Coach ↔ Profile).
 *
 * Why this instead of replacing the bottom-tabs navigator: keeps Expo Router's
 * file-based routing intact, lets us keep the lovely bottom bar, and works the
 * same on iOS / Android / Web.
 */
import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useRouter, useSegments } from 'expo-router';

// Bottom-tab order must match `frontend/app/(tabs)/_layout.tsx`.
const TAB_ORDER = ['index', 'apps', 'stats', 'coach', 'profile'];

// Minimum horizontal travel (in dp) before we count it as a tab-change swipe.
const SWIPE_THRESHOLD = 60;
// Maximum vertical travel — if you swipe more vertically than this it's a
// scroll, not a tab change.
const VERTICAL_TOLERANCE = 40;

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function SwipeableTab({ children, style }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const navigating = useRef(false);

  // `segments` looks like ['(tabs)', 'apps']  →  current = 'apps'
  // For the index route it's just ['(tabs)']  →  current = 'index'
  const current = (segments[1] as string | undefined) ?? 'index';
  const idx = TAB_ORDER.indexOf(current);

  const goTo = (delta: number) => {
    if (navigating.current) return;
    const next = idx + delta;
    if (next < 0 || next >= TAB_ORDER.length) return;
    const name = TAB_ORDER[next];
    const href = name === 'index' ? '/(tabs)' : `/(tabs)/${name}`;
    navigating.current = true;
    router.replace(href as any);
    // Debounce so a stray gesture can't double-fire.
    setTimeout(() => {
      navigating.current = false;
    }, 350);
  };

  const pan = Gesture.Pan()
    // Only react when fingers have moved a clear horizontal distance,
    // so child ScrollViews keep working normally.
    .activeOffsetX([-12, 12])
    .failOffsetY([-VERTICAL_TOLERANCE, VERTICAL_TOLERANCE])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationY) > VERTICAL_TOLERANCE) return;
      if (e.translationX <= -SWIPE_THRESHOLD) {
        runOnJS(goTo)(1);   // left swipe → next tab
      } else if (e.translationX >= SWIPE_THRESHOLD) {
        runOnJS(goTo)(-1);  // right swipe → previous tab
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.flex, style]} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
