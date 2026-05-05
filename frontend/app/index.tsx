import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Activity, Shield, ArrowRight, Sparkles } from 'lucide-react-native';
import { theme } from '../src/theme';

export default function Onboarding() {
  const router = useRouter();
  const [granting, setGranting] = useState(false);

  const handleGrant = () => {
    setGranting(true);
    // In a real APK build, this would open Settings -> Usage Access.
    // For preview we simulate and proceed to the dashboard.
    setTimeout(() => {
      Alert.alert(
        'Preview Mode',
        'On a real Android device this opens Settings → Usage Access. The preview uses realistic mock data so you can explore the full UI.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
      setGranting(false);
    }, 600);
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1698156731209-b2fae65b5d24?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBncmFkaWVudCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc3OTY5NzU0fDA&ixlib=rb-4.1.0&q=85',
      }}
      style={styles.bg}
      imageStyle={{ opacity: 0.45 }}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Activity size={20} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.brand}>SCREENSENSE</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>DIGITAL WELLNESS</Text>
          <Text style={styles.title}>
            Master your{'\n'}
            <Text style={{ color: theme.colors.primary }}>screen time.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Automatically track every app, call, and category — so you can build
            habits that actually stick.
          </Text>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Activity size={16} color={theme.colors.accent} strokeWidth={2} />
              <Text style={styles.featureText}>Live app usage</Text>
            </View>
            <View style={styles.featureItem}>
              <Sparkles size={16} color={theme.colors.primary} strokeWidth={2} />
              <Text style={styles.featureText}>AI insights</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={16} color={theme.colors.warning} strokeWidth={2} />
              <Text style={styles.featureText}>Private</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.permBox} testID="permission-info">
            <Shield size={16} color={theme.colors.textSecondary} />
            <Text style={styles.permText}>
              We&apos;ll ask for{' '}
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                Usage Access
              </Text>{' '}
              permission. Data stays on your device.
            </Text>
          </View>

          <TouchableOpacity
            testID="grant-permission-btn"
            style={[styles.cta, granting && { opacity: 0.7 }]}
            onPress={handleGrant}
            disabled={granting}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {granting ? 'Granting access…' : 'Grant access & continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.7)',
  },
  safe: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: '800',
  },
  body: { flex: 1, justifyContent: 'center' },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: 320,
  },
  featureRow: {
    flexDirection: 'row',
    marginTop: 28,
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  featureText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  footer: { paddingBottom: 12 },
  permBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 14,
  },
  permText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    marginLeft: 8,
  },
  cta: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.2,
  },
});
