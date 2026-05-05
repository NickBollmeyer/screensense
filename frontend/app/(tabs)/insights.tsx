import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, RefreshCw, Lightbulb, Target, TrendingUp } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { api, Insight } from '../../src/api';
import CircularProgress from '../../src/components/CircularProgress';

export default function InsightsScreen() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      if (force) setRegenerating(true);
      const d = force ? await api.generateInsights() : await api.getTodayInsights();
      setInsight(d);
    } catch (e) {
      console.warn('insight load failed', e);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loader} testID="insights-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Analyzing your habits…</Text>
      </View>
    );
  }

  const score = insight?.score ?? 70;
  const scoreColor =
    score >= 75
      ? theme.colors.accent
      : score >= 50
      ? theme.colors.primary
      : theme.colors.warning;
  const scoreLabel = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs focus';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={regenerating}
            onRefresh={() => load(true)}
            tintColor={theme.colors.primary}
          />
        }
        testID="insights-scroll"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AI COACH</Text>
            <Text style={styles.title}>Insights</Text>
          </View>
          <TouchableOpacity
            style={styles.regenBtn}
            onPress={() => load(true)}
            disabled={regenerating}
            testID="regenerate-insights-btn"
          >
            <RefreshCw
              size={14}
              color={theme.colors.primary}
              strokeWidth={2.2}
              style={regenerating ? { opacity: 0.5 } : undefined}
            />
            <Text style={styles.regenText}>
              {regenerating ? 'Refreshing' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wellness Score Hero */}
        <View style={styles.scoreCard} testID="wellness-score-card">
          <View style={styles.scoreLeft}>
            <CircularProgress
              progress={score / 100}
              size={140}
              strokeWidth={12}
              color={scoreColor}
              centerLabel={String(score)}
              centerSubLabel="/ 100"
            />
          </View>
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreLabelTxt, { color: scoreColor }]}>
              {scoreLabel.toUpperCase()}
            </Text>
            <Text style={styles.scoreTitle}>Wellness Score</Text>
            <Text style={styles.scoreSummary}>{insight?.summary}</Text>
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <TrendingUp size={14} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.sectionTitle}>Highlights</Text>
          </View>
          {insight?.highlights.map((h, i) => (
            <View
              key={i}
              style={styles.itemCard}
              testID={`highlight-${i}`}
            >
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.itemText}>{h}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIconBox, { backgroundColor: theme.colors.accentDim }]}
            >
              <Lightbulb size={14} color={theme.colors.accent} strokeWidth={2.2} />
            </View>
            <Text style={styles.sectionTitle}>Recommendations</Text>
          </View>
          {insight?.recommendations.map((r, i) => (
            <View
              key={i}
              style={[styles.itemCard, styles.recCard]}
              testID={`recommendation-${i}`}
            >
              <View
                style={[styles.itemNumber, { backgroundColor: theme.colors.accentDim }]}
              >
                <Target size={12} color={theme.colors.accent} strokeWidth={2.5} />
              </View>
              <Text style={styles.itemText}>{r}</Text>
            </View>
          ))}
        </View>

        {/* AI signature */}
        <View style={styles.signature}>
          <Sparkles size={12} color={theme.colors.textMuted} strokeWidth={2} />
          <Text style={styles.signatureText}>
            Generated by Claude Sonnet 4.5 · Updated{' '}
            {insight ? new Date(insight.date).toLocaleDateString() : 'today'}
          </Text>
        </View>
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
    gap: 16,
  },
  loadingText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 12 },
  scroll: { padding: 20, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary + '55',
    backgroundColor: theme.colors.primaryDim,
  },
  regenText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  scoreLeft: { alignItems: 'center', justifyContent: 'center' },
  scoreRight: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  scoreLabelTxt: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 6,
  },
  scoreTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  scoreSummary: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    gap: 12,
  },
  recCard: { borderColor: theme.colors.accent + '33' },
  itemNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  itemNumberText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  itemText: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  signatureText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
});
