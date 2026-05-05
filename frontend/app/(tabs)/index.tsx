import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Phone,
  Bell,
  Hand,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { theme, formatDuration, formatDurationShort } from '../../src/theme';
import { api, TodayUsage, WeekDay } from '../../src/api';
import CircularProgress from '../../src/components/CircularProgress';
import TaskFunBar from '../../src/components/TaskFunBar';
import WeekChart from '../../src/components/WeekChart';
import CategoryIcon from '../../src/components/CategoryIcon';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<TodayUsage | null>(null);
  const [week, setWeek] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [today, weekData] = await Promise.all([api.getToday(), api.getWeek()]);
      setData(today);
      setWeek(weekData.days);
    } catch (e) {
      console.warn('load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading || !data) {
    return (
      <View style={styles.loader} testID="dashboard-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const dailyGoal = 6 * 3600; // 6 hours target ceiling
  const ringProgress = Math.min(data.total_seconds / dailyGoal, 1);
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Week trend comparison
  const yesterdaySec = week.length >= 2 ? week[week.length - 2].total_seconds : 0;
  const diff = data.total_seconds - yesterdaySec;
  const diffPct = yesterdaySec > 0 ? Math.abs((diff / yesterdaySec) * 100) : 0;
  const trendUp = diff > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        testID="dashboard-scroll"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{dateLabel.toUpperCase()}</Text>
            <Text style={styles.title}>Today</Text>
          </View>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        {/* Hero Ring */}
        <View style={styles.heroCard} testID="hero-card">
          <CircularProgress
            progress={ringProgress}
            size={240}
            strokeWidth={16}
            color={ringProgress > 0.85 ? theme.colors.warning : theme.colors.primary}
            centerLabel={formatDurationShort(data.total_seconds)}
            centerSubLabel="SCREEN TIME"
          />
          <View style={styles.heroFooter}>
            <View style={styles.trendChip}>
              {trendUp ? (
                <TrendingUp size={12} color={theme.colors.warning} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={12} color={theme.colors.accent} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  styles.trendText,
                  { color: trendUp ? theme.colors.warning : theme.colors.accent },
                ]}
              >
                {diffPct.toFixed(0)}% vs yesterday
              </Text>
            </View>
          </View>
        </View>

        {/* Task vs Fun */}
        <View style={styles.card} testID="task-fun-card">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task vs Fun</Text>
            <Text style={styles.cardSubtitle}>
              {formatDurationShort(data.task_seconds)} ·{' '}
              {formatDurationShort(data.fun_seconds)}
            </Text>
          </View>
          <TaskFunBar
            taskSeconds={data.task_seconds}
            funSeconds={data.fun_seconds}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard} testID="stat-pickups">
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
              <Hand size={16} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{data.pickups}</Text>
            <Text style={styles.statLabel}>PICKUPS</Text>
          </View>
          <View style={styles.statCard} testID="stat-notifs">
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,59,48,0.15)' }]}>
              <Bell size={16} color={theme.colors.warning} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{data.notifications}</Text>
            <Text style={styles.statLabel}>NOTIFS</Text>
          </View>
          <View style={styles.statCard} testID="stat-calls">
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,255,102,0.15)' }]}>
              <Phone size={16} color={theme.colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>
              {formatDurationShort(data.call_seconds)}
            </Text>
            <Text style={styles.statLabel}>CALLS · {data.call_count}</Text>
          </View>
        </View>

        {/* Week chart */}
        <View style={styles.card} testID="week-card">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This week</Text>
            <Text style={styles.cardSubtitle}>
              avg{' '}
              {formatDurationShort(
                week.length
                  ? Math.round(
                      week.reduce((s, d) => s + d.total_seconds, 0) / week.length
                    )
                  : 0
              )}
            </Text>
          </View>
          <WeekChart days={week} />
        </View>

        {/* Top Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top categories</Text>
          <TouchableOpacity testID="see-apps-link" onPress={() => router.push('/(tabs)/apps')}>
            <Text style={styles.linkText}>See all</Text>
          </TouchableOpacity>
        </View>

        {data.categories.slice(0, 5).map((cat) => {
          const pct =
            data.total_seconds > 0
              ? (cat.duration_seconds / data.total_seconds) * 100
              : 0;
          const hasGoal = cat.goal_minutes !== undefined && cat.goal_minutes > 0;
          const goalProgress = Math.min((cat.goal_progress ?? 0) * 100, 100);
          const exceeded = !!cat.goal_exceeded;
          const barWidth = hasGoal ? goalProgress : pct;
          const barColor = exceeded ? theme.colors.warning : cat.color;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catRow,
                exceeded && {
                  borderColor: theme.colors.warning + '55',
                  backgroundColor: theme.colors.warningDim,
                },
              ]}
              testID={`cat-row-${cat.id}`}
              onPress={() => router.push(`/category/${cat.id}` as any)}
              activeOpacity={0.7}
            >
              <CategoryIcon
                name={cat.icon}
                bg={cat.color + '26'}
                color={cat.color}
                rounded={12}
              />
              <View style={styles.catBody}>
                <View style={styles.catTopLine}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text
                    style={[
                      styles.catTime,
                      exceeded && { color: theme.colors.warning },
                    ]}
                  >
                    {formatDuration(cat.duration_seconds)}
                  </Text>
                </View>
                <View style={styles.catProgressTrack}>
                  <View
                    style={[
                      styles.catProgressFill,
                      { width: `${barWidth}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
                <View style={styles.catBottomLine}>
                  {hasGoal ? (
                    <View
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor: exceeded
                            ? theme.colors.warningDim
                            : theme.colors.primaryDim,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          {
                            color: exceeded
                              ? theme.colors.warning
                              : theme.colors.primary,
                          },
                        ]}
                      >
                        {exceeded ? 'OVER LIMIT' : `${cat.goal_minutes}M GOAL`}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor:
                            cat.type === 'task'
                              ? theme.colors.accentDim
                              : theme.colors.warningDim,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          {
                            color:
                              cat.type === 'task'
                                ? theme.colors.accent
                                : theme.colors.warning,
                          },
                        ]}
                      >
                        {cat.type.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.catSubText}>
                    {hasGoal
                      ? `${Math.round(cat.duration_seconds / 60)} / ${cat.goal_minutes} min`
                      : `${cat.app_count} app${cat.app_count !== 1 ? 's' : ''} · ${pct.toFixed(0)}%`}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={theme.colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { padding: 20, paddingBottom: 110 },
  loader: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroFooter: { marginTop: 16 },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  trendText: { fontSize: 11, fontWeight: '700', marginLeft: 6, letterSpacing: 0.5 },
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
    marginBottom: 16,
  },
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  cardSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 14,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  catBody: { flex: 1, marginLeft: 14, marginRight: 10 },
  catTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catName: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  catTime: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  catProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  catProgressFill: { height: '100%', borderRadius: 2 },
  catBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  catBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  catSubText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '500' },
});
