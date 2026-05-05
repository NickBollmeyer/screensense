import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, formatDurationShort } from '../theme';
import type { MonthDay } from '../api';

type Props = {
  days: MonthDay[];
};

// Render a 30-day heat-map: each row is a week, columns Mon-Sun.
// We pad blanks to align weekdays.
export default function MonthlyHeatmap({ days }: Props) {
  if (!days.length) {
    return <View style={{ height: 160 }} />;
  }
  const max = Math.max(1, ...days.map((d) => d.total_seconds));

  // Pad start so first day aligns with weekday column
  const firstWd = days[0].weekday; // 0=Mon ... 6=Sun (Python)
  const blanks: (MonthDay | null)[] = Array(firstWd).fill(null);
  const grid: (MonthDay | null)[] = [...blanks, ...days];
  // Pad to multiple of 7
  while (grid.length % 7 !== 0) grid.push(null);

  const weeks: (MonthDay | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const intensityColor = (sec: number): string => {
    if (sec === 0) return 'rgba(255,255,255,0.04)';
    const t = Math.min(sec / max, 1);
    if (t < 0.25) return 'rgba(0,122,255,0.18)';
    if (t < 0.5) return 'rgba(0,122,255,0.38)';
    if (t < 0.75) return 'rgba(0,122,255,0.62)';
    return 'rgba(0,122,255,0.92)';
  };

  return (
    <View style={styles.wrap} testID="monthly-heatmap">
      <View style={styles.headerRow}>
        {dayLabels.map((l, i) => (
          <Text key={i} style={styles.headerLabel}>
            {l}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((d, i) =>
            d ? (
              <View
                key={i}
                style={[
                  styles.cell,
                  { backgroundColor: intensityColor(d.total_seconds) },
                ]}
                testID={`heatmap-cell-${d.date}`}
              >
                <Text style={styles.cellText}>{d.day}</Text>
              </View>
            ) : (
              <View key={i} style={[styles.cell, styles.cellBlank]} />
            )
          )}
        </View>
      ))}
      <View style={styles.legend}>
        <Text style={styles.legendLbl}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0,122,255,0.18)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0,122,255,0.38)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0,122,255,0.62)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0,122,255,0.92)' }]} />
        <Text style={styles.legendLbl}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBlank: { backgroundColor: 'transparent' },
  cellText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLbl: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginHorizontal: 4,
  },
});
