import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Activity, ArrowRight } from 'lucide-react-native';
import { theme, formatDurationShort } from '../../src/theme';
import { api } from '../../src/api';

export default function ShockScreen() {
  const router = useRouter();
  const [weekTotal, setWeekTotal] = useState<number | null>(null);
  const [counter, setCounter] = useState(0);
  const animatedHours = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getWeek();
        const total = data.days.reduce((s, d) => s + d.total_seconds, 0);
        setWeekTotal(total);
        Animated.timing(animatedHours, {
          toValue: total,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
        animatedHours.addListener(({ value }) => setCounter(value));
      } catch (e) {
        console.warn(e);
        setWeekTotal(0);
      }
    })();
    return () => {
      animatedHours.removeAllListeners();
    };
  }, [animatedHours]);

  if (weekTotal === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loaderText}>Reading your last 7 days…</Text>
      </View>
    );
  }

  const hours = Math.floor(counter / 3600);
  const mins = Math.floor((counter % 3600) / 60);
  const totalHours = weekTotal / 3600;
  // Working day = 8 hours
  const workingDays = (totalHours / 8).toFixed(1);
  // Annual extrapolation
  const yearlyHours = Math.round(totalHours * 52);
  const yearlyDays = Math.round(yearlyHours / 24);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconBox}>
          <Activity size={20} color={theme.colors.warning} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>YOUR LAST 7 DAYS</Text>

        <Text style={styles.bigNumber}>
          {hours}h {mins}m
        </Text>
        <Text style={styles.subtitle}>on your phone this week.</Text>

        <View style={styles.equationCard} testID="shock-equation-card">
          <Text style={styles.equationRow}>
            That&apos;s{' '}
            <Text style={styles.equationHighlight}>{workingDays} working days</Text>
            .
          </Text>
          <Text style={styles.equationRow}>
            At this rate,{' '}
            <Text style={styles.equationHighlight}>
              {yearlyDays} days a year
            </Text>{' '}
            of your life.
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.cta}>
          ScreenSense will help you take some of those days back.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => router.replace('/paywall')}
        testID="shock-continue-btn"
        activeOpacity={0.85}
      >
        <Text style={styles.continueText}>Show me how</Text>
        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 28 },
  loader: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loaderText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 12 },
  body: { flex: 1, justifyContent: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.warningDim,
    borderWidth: 1,
    borderColor: theme.colors.warning + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    color: theme.colors.warning,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 14,
  },
  bigNumber: {
    color: theme.colors.text,
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 84,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    marginTop: 4,
    marginBottom: 28,
  },
  equationCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  equationRow: { color: theme.colors.text, fontSize: 16, lineHeight: 24 },
  equationHighlight: {
    color: theme.colors.warning,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 24,
  },
  cta: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  continueBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.2,
  },
});
