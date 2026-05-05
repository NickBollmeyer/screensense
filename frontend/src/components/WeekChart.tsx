import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, formatDurationShort } from '../theme';

type Day = {
  date: string;
  day_label: string;
  total_seconds: number;
  task_seconds: number;
  fun_seconds: number;
};

type Props = { days: Day[] };

export default function WeekChart({ days }: Props) {
  const maxSec = Math.max(1, ...days.map((d) => d.total_seconds));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.wrap} testID="week-chart">
      <View style={styles.bars}>
        {days.map((d) => {
          const taskH = (d.task_seconds / maxSec) * 100;
          const funH = (d.fun_seconds / maxSec) * 100;
          const isToday = d.date === today;
          return (
            <View key={d.date} style={styles.barCol} testID={`week-bar-${d.date}`}>
              <Text style={styles.barValue}>
                {formatDurationShort(d.total_seconds)}
              </Text>
              <View style={styles.barTrack}>
                {funH > 0 && (
                  <View
                    style={[
                      styles.barFun,
                      { height: `${funH}%`, backgroundColor: theme.colors.warning },
                    ]}
                  />
                )}
                {taskH > 0 && (
                  <View
                    style={[
                      styles.barTask,
                      { height: `${taskH}%`, backgroundColor: theme.colors.accent },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  isToday && { color: theme.colors.text, fontWeight: '700' },
                ]}
              >
                {d.day_label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  bars: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    color: theme.colors.textMuted,
    fontSize: 9,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 18,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  barTask: { width: '100%', borderRadius: 6 },
  barFun: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  dayLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 1,
  },
});
