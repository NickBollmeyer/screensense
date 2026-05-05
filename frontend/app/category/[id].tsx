import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme, formatDuration, formatDurationShort } from '../../src/theme';
import { api } from '../../src/api';
import CategoryIcon from '../../src/components/CategoryIcon';
import Sparkline from '../../src/components/Sparkline';

type CategoryDetail = {
  id: string;
  name: string;
  type: 'task' | 'fun';
  color: string;
  icon: string;
  apps: any[];
  trend: { date: string; day_label: string; seconds: number }[];
  total_today: number;
};

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getCategoryDetail(String(id));
        setData(d as any);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !data) {
    return (
      <View style={styles.loader} testID="category-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const trendValues = data.trend.map((t) => t.seconds);
  const maxSec = Math.max(...trendValues, 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          testID="back-btn"
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Category</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} testID="category-scroll">
        {/* Hero */}
        <View
          style={[
            styles.heroCard,
            { borderColor: data.color + '55', backgroundColor: data.color + '0F' },
          ]}
        >
          <CategoryIcon name={data.icon} size={26} color={data.color} bg={data.color + '26'} rounded={14} />
          <Text style={[styles.heroLabel, { color: data.color }]}>
            {data.type.toUpperCase()}
          </Text>
          <Text style={styles.heroName}>{data.name}</Text>
          <Text style={styles.heroTime}>{formatDuration(data.total_today)}</Text>
          <Text style={styles.heroSub}>today</Text>
        </View>

        {/* 7-day trend */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>7-day trend</Text>
            <Text style={styles.cardSub}>
              avg{' '}
              {formatDurationShort(
                Math.round(trendValues.reduce((s, v) => s + v, 0) / Math.max(trendValues.length, 1))
              )}
            </Text>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Sparkline values={trendValues} width={300} height={80} color={data.color} />
          </View>
          <View style={styles.trendRow}>
            {data.trend.map((t) => (
              <View key={t.date} style={styles.trendCol}>
                <Text style={styles.trendVal}>
                  {Math.round(t.seconds / 60)}m
                </Text>
                <View style={styles.trendBarTrack}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${(t.seconds / maxSec) * 100}%`,
                        backgroundColor: data.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendDay}>{t.day_label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Apps in category */}
        <Text style={styles.sectionTitle}>Apps today</Text>
        {data.apps.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No app activity in this category today.</Text>
          </View>
        ) : (
          data.apps.map((app) => (
            <View
              key={app.package_name + app.app_name}
              style={styles.appRow}
              testID={`cat-app-${app.package_name}`}
            >
              <View
                style={[
                  styles.appIcon,
                  { backgroundColor: data.color + '22', borderColor: data.color + '55' },
                ]}
              >
                <Text style={[styles.appIconText, { color: data.color }]}>
                  {app.app_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.appBody}>
                <Text style={styles.appName}>{app.app_name}</Text>
                <Text style={styles.appLaunches}>{app.launches} opens</Text>
              </View>
              <Text style={styles.appTime}>{formatDuration(app.duration_seconds)}</Text>
            </View>
          ))
        )}
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
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  scroll: { padding: 20 },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    marginTop: 12,
  },
  heroName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  heroTime: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginTop: 16,
  },
  heroSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
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
    marginBottom: 14,
  },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  trendRow: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  trendCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendVal: { color: theme.colors.textMuted, fontSize: 9, marginBottom: 4 },
  trendBarTrack: {
    width: 14,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  trendBarFill: { width: '100%', borderRadius: 4 },
  trendDay: { color: theme.colors.textMuted, fontSize: 10, marginTop: 6 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontSize: 16, fontWeight: '800' },
  appBody: { flex: 1, marginLeft: 12 },
  appName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  appLaunches: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  appTime: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: 13 },
});
