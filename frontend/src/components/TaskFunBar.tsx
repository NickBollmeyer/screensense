import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

type Props = {
  taskSeconds: number;
  funSeconds: number;
};

export default function TaskFunBar({ taskSeconds, funSeconds }: Props) {
  const total = taskSeconds + funSeconds;
  const taskPct = total > 0 ? (taskSeconds / total) * 100 : 0;
  const funPct = total > 0 ? (funSeconds / total) * 100 : 0;

  return (
    <View style={styles.wrap} testID="task-fun-bar">
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
          <Text style={styles.legendText}>TASK</Text>
          <Text style={styles.legendPct}>{Math.round(taskPct)}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
          <Text style={styles.legendText}>FUN</Text>
          <Text style={styles.legendPct}>{Math.round(funPct)}%</Text>
        </View>
      </View>
      <View style={styles.bar}>
        {taskPct > 0 && (
          <View
            style={[
              styles.taskSeg,
              { flex: taskPct, backgroundColor: theme.colors.accent },
            ]}
          />
        )}
        {funPct > 0 && (
          <View
            style={[
              styles.funSeg,
              { flex: funPct, backgroundColor: theme.colors.warning },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginRight: 6,
    fontWeight: '600',
  },
  legendPct: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  bar: {
    height: 14,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  taskSeg: { borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  funSeg: { borderTopRightRadius: 7, borderBottomRightRadius: 7 },
});
