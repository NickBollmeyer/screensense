import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  Check,
  Sparkles,
  Calendar,
  MessageSquare,
  Target,
  Moon,
  TrendingUp,
} from 'lucide-react-native';
import { theme } from '../src/theme';
import { billing, Plan, formatPrice } from '../src/billing';

const PRO_FEATURES = [
  { icon: MessageSquare, text: 'Unlimited AI Coach messages with memory' },
  { icon: Calendar, text: '30-day heatmap & full habit history' },
  { icon: Target, text: 'Unlimited daily limits across all categories' },
  { icon: Moon, text: 'Unlimited Focus Mode presets & schedules' },
  { icon: TrendingUp, text: 'Weekly trend reports & data export' },
  { icon: Sparkles, text: 'Family sharing — up to 5 members' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string>('premium_annual');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await billing.getPlans();
        setPlans(list);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startTrial = async () => {
    setSubmitting(true);
    try {
      await billing.startTrial(selected);
      await AsyncStorage.setItem('screensense.onboarding_complete', '1');
      Alert.alert(
        'Trial activated',
        '7 days free. We will not charge you until your trial ends — and only if you choose to keep going.',
        [{ text: 'Awesome', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e: any) {
      Alert.alert('Could not start trial', e.message || 'Try again');
    } finally {
      setSubmitting(false);
    }
  };

  const skipForNow = async () => {
    try {
      await AsyncStorage.setItem('screensense.onboarding_complete', '1');
    } catch {
      // ignore
    }
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const monthly = plans.find((p) => p.id === 'premium_monthly');
  const annual = plans.find((p) => p.id === 'premium_annual');
  const annualMonthly = annual ? Math.round(annual.price_cents / 12) / 100 : 2.5;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} testID="paywall-scroll">
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={skipForNow}
          testID="paywall-close"
        >
          <X size={20} color={theme.colors.textSecondary} strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.heroIcon}>
          <Sparkles size={32} color={theme.colors.primary} strokeWidth={2.2} />
        </View>

        <Text style={styles.eyebrow}>SCREENSENSE PRO</Text>
        <Text style={styles.title}>Get your hours{'\n'}back.</Text>
        <Text style={styles.subtitle}>
          Most users save <Text style={styles.bold}>90 minutes a day</Text> in
          their first month. At minimum wage that&apos;s $13/day.{'\n'}Pro pays
          for itself in 6 days.
        </Text>

        {/* Plan cards */}
        <View style={styles.plans}>
          {annual && (
            <TouchableOpacity
              testID="plan-annual"
              onPress={() => setSelected('premium_annual')}
              activeOpacity={0.85}
              style={[
                styles.plan,
                selected === 'premium_annual' && styles.planSelected,
              ]}
            >
              <View style={styles.bestValue}>
                <Text style={styles.bestValueText}>BEST VALUE · SAVE 50%</Text>
              </View>
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.planPrice}>
                    {formatPrice(annual.price_cents)}/year
                  </Text>
                  <Text style={styles.planSub}>
                    Just ${annualMonthly.toFixed(2)}/month
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected === 'premium_annual' && styles.radioActive,
                  ]}
                >
                  {selected === 'premium_annual' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}

          {monthly && (
            <TouchableOpacity
              testID="plan-monthly"
              onPress={() => setSelected('premium_monthly')}
              activeOpacity={0.85}
              style={[
                styles.plan,
                selected === 'premium_monthly' && styles.planSelected,
              ]}
            >
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>
                    {formatPrice(monthly.price_cents)}/month
                  </Text>
                  <Text style={styles.planSub}>Cancel anytime</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected === 'premium_monthly' && styles.radioActive,
                  ]}
                >
                  {selected === 'premium_monthly' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.features}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <f.icon size={14} color={theme.colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
              <Check size={14} color={theme.colors.accent} strokeWidth={2.6} />
            </View>
          ))}
        </View>

        <TouchableOpacity
          testID="start-trial-btn"
          style={[styles.cta, submitting && { opacity: 0.6 }]}
          onPress={startTrial}
          disabled={submitting}
        >
          <Text style={styles.ctaText}>
            {submitting ? 'Starting…' : 'Start 7-day free trial'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          No card required for the trial. Cancel anytime in Google Play.{'\n'}
          After 7 days, the selected plan starts unless cancelled.
        </Text>

        <TouchableOpacity onPress={skipForNow} testID="skip-paywall-btn">
          <Text style={styles.skipText}>Continue with free version</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  loader: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 24, paddingBottom: 40, alignItems: 'stretch' },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryDim,
    borderWidth: 1,
    borderColor: theme.colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '800',
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 40,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
  },
  bold: { color: theme.colors.text, fontWeight: '800' },
  plans: { gap: 10, marginBottom: 22 },
  plan: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
  },
  planSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryDim,
  },
  bestValue: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  bestValueText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planName: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  planPrice: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  planSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  radioActive: { borderColor: theme.colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  features: { marginBottom: 22 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  featureText: { flex: 1, color: theme.colors.text, fontSize: 13, marginLeft: 4 },
  cta: {
    height: 56,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
