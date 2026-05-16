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
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  Target,
  TrendingUp,
  Calendar,
  TrendingDown,
} from 'lucide-react-native';
import { theme, formatDurationShort } from '../../src/theme';
import { api, Insight, MonthUsage } from '../../src/api';
import CircularProgress from '../../src/components/CircularProgress';
import MonthlyHeatmap from '../../src/components/MonthlyHeatmap';
import SwipeableTab from '../../src/components/SwipeableTab';

export default function StatsScreen() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [month, setMonth] = useState<MonthUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async (force = false) => {
    try {
      if (force) setRegenerating(true);
      const [insightData, monthData] = await Promise.all([
        force ? api.generateInsights() : api.getTodayInsights(),
        api.getMonth(),
      ]);
      setInsight(insightData);
      setMonth(monthData);
    } catch (e) {
      console.warn('stats load failed', e);
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
      <View style={styles.loader} testID="stats-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.loadingText}>Crunching numbers…</Text>
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
    <SwipeableTab>
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
        testID="stats-scroll"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>HABIT REPORT</Text>
            <Text style={styles.title}>Stats</Text>
          </View>
          <TouchableOpacity
            style={styles.regenBtn}
            onPress={() => load(true)}
            disabled={regenerating}
            testID="regenerate-insights-btn"
          >
            <RefreshCw size={14} color={theme.colors.primary} strokeWidth={2.2} />
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
              size={130}
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
            <Text style={styles.scoreSummary} numberOfLines={4}>
              {insight?.summary}
            </Text>
          </View>
        </View>

        {/* Monthly heatmap */}
        <View style={styles.card} testID="month-card">
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Calendar size={14} color={theme.colors.primary} strokeWidth={2.2} />
              <Text style={styles.cardTitle}>30-day heatmap</Text>
            </View>
            <Text style={styles.cardSub}>
              avg {formatDurationShort(month?.summary.avg_seconds ?? 0)}/day
            </Text>
          </View>
          <MonthlyHeatmap days={month?.days ?? []} />

          <View style={styles.bestRow}>
            <View style={styles.bestCol} testID="best-day-card">
              <View style={styles.bestIcon}>
                <TrendingDown size={14} color={theme.colors.accent} strokeWidth={2.4} />
              </View>
              <Text style={styles.bestLbl}>BEST DAY</Text>
              <Text style={styles.bestVal}>
                {formatDurationShort(month?.summary.best_day?.total_seconds ?? 0)}
              </Text>
              <Text style={styles.bestDate}>
                {month?.summary.best_day
                  ? new Date(month.summary.best_day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>
            <View style={styles.bestCol} testID="worst-day-card">
              <View style={[styles.bestIcon, { backgroundColor: theme.colors.warningDim }]}>
                <TrendingUp size={14} color={theme.colors.warning} strokeWidth={2.4} />
              </View>
              <Text style={styles.bestLbl}>HEAVIEST</Text>
              <Text style={styles.bestVal}>
                {formatDurationShort(month?.summary.worst_day?.total_seconds ?? 0)}
              </Text>
              <Text style={styles.bestDate}>
                {month?.summary.worst_day
                  ? new Date(month.summary.worst_day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>
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
            <View key={i} style={styles.itemCard} testID={`highlight-${i}`}>
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

        <View style={styles.signature}>
          <Sparkles size={12} color={theme.colors.textMuted} strokeWidth={2} />
          <Text style={styles.signatureText}>
            Generated by Claude Sonnet 4.5
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </SwipeableTab>
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
    padding: 16,
    marginBottom: 16,
  },
  scoreLeft: { alignItems: 'center', justifyContent: 'center' },
  scoreRight: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  scoreLabelTxt: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 4,
  },
  scoreTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreSummary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  cardSub: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  bestRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  bestCol: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bestIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bestLbl: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  bestVal: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bestDate: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
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
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
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
  itemNumberText: { color: theme.colors.primary, fontSize: 11, fontWeight: '800' },
  itemText: { color: theme.colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 6,
  },
  signatureText: { color: theme.colors.textMuted, fontSize: 11, marginLeft: 4 },
});
