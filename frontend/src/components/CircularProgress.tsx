import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';

type Props = {
  size?: number;
  strokeWidth?: number;
  // 0 - 1
  progress: number;
  color?: string;
  trackColor?: string;
  centerLabel?: string;
  centerSubLabel?: string;
};

export default function CircularProgress({
  size = 220,
  strokeWidth = 14,
  progress,
  color = theme.colors.primary,
  trackColor = 'rgba(255,255,255,0.06)',
  centerLabel,
  centerSubLabel,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={[styles.wrap, { width: size, height: size }]} testID="circular-progress">
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0.4} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center}>
        {centerLabel ? (
          <Text style={styles.label} testID="ring-center-label">
            {centerLabel}
          </Text>
        ) : null}
        {centerSubLabel ? (
          <Text style={styles.subLabel} testID="ring-center-sublabel">
            {centerSubLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.text,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
