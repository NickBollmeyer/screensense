import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme, formatDuration } from '../../src/theme';
import { api, TodayUsage, CategoryMeta } from '../../src/api';
import SwipeableTab from '../../src/components/SwipeableTab';

export default function AppsScreen() {
  const router = useRouter();
  const [data, setData] = useState<TodayUsage | null>(null);
  const [cats, setCats] = useState<CategoryMeta[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [today, c] = await Promise.all([api.getToday(), api.getCategories()]);
        setData(today);
        setCats(c);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const catMeta = useMemo(() => {
    const m: Record<string, CategoryMeta> = {};
    cats.forEach((c) => (m[c.id] = c));
    return m;
  }, [cats]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.apps;
    if (filter !== 'all') list = list.filter((a) => a.category_id === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.app_name.toLowerCase().includes(q));
    }
    return list;
  }, [data, filter, search]);

  if (loading || !data) {
    return (
      <View style={styles.loader} testID="apps-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const totalFiltered = filtered.reduce((s, a) => s + a.duration_seconds, 0);

  return (
    <SwipeableTab>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>USAGE</Text>
        <Text style={styles.title}>Apps</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color={theme.colors.textMuted} strokeWidth={2} />
        <TextInput
          testID="app-search-input"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search apps"
          placeholderTextColor={theme.colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} testID="clear-search-btn">
            <X size={16} color={theme.colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          testID="filter-all"
          style={[styles.chip, filter === 'all' && styles.chipActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.chipText, filter === 'all' && styles.chipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        {cats.map((c) => (
          <TouchableOpacity
            key={c.id}
            testID={`filter-${c.id}`}
            style={[
              styles.chip,
              filter === c.id && { backgroundColor: c.color + '22', borderColor: c.color },
            ]}
            onPress={() => setFilter(c.id)}
          >
            <View style={[styles.chipDot, { backgroundColor: c.color }]} />
            <Text
              style={[
                styles.chipText,
                filter === c.id && { color: theme.colors.text, fontWeight: '700' },
              ]}
            >
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText} testID="apps-summary">
          {filtered.length} app{filtered.length !== 1 ? 's' : ''} ·{' '}
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
            {formatDuration(totalFiltered)}
          </Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        testID="apps-list"
      >
        {filtered.map((app) => {
          const meta = catMeta[app.category_id];
          const color = meta?.color ?? theme.colors.primary;
          const initial = app.app_name.charAt(0).toUpperCase();
          return (
            <TouchableOpacity
              key={app.package_name + app.app_name}
              style={styles.appRow}
              testID={`app-row-${app.package_name}`}
              activeOpacity={0.7}
              onPress={() => router.push(`/category/${app.category_id}` as any)}
            >
              <View style={[styles.appIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                <Text style={[styles.appIconText, { color }]}>{initial}</Text>
              </View>
              <View style={styles.appBody}>
                <Text style={styles.appName} numberOfLines={1}>
                  {app.app_name}
                </Text>
                <View style={styles.appMeta}>
                  <View style={[styles.appBadge, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.appBadgeText, { color }]}>
                      {meta?.name ?? app.category_id}
                    </Text>
                  </View>
                  <Text style={styles.appSubText}>{app.launches} opens</Text>
                </View>
              </View>
              <Text style={styles.appTime}>{formatDuration(app.duration_seconds)}</Text>
              <ChevronRight size={16} color={theme.colors.textMuted} strokeWidth={2} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.empty} testID="apps-empty">
            <Text style={styles.emptyText}>No apps match your filters</Text>
          </View>
        )}
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
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    paddingHorizontal: 6,
    height: 44,
  },
  chipRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    gap: 6,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryDim,
    borderColor: theme.colors.primary,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: { color: theme.colors.primary, fontWeight: '700' },
  summaryRow: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  summaryText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  list: { padding: 20, paddingBottom: 110 },
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
  appMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  appBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  appSubText: { color: theme.colors.textMuted, fontSize: 11, marginLeft: 6 },
  appTime: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: theme.colors.textMuted, fontSize: 13 },
});
