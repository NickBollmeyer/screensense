import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Target,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { api, CategoryMeta, Goal } from '../../src/api';
import CategoryIcon from '../../src/components/CategoryIcon';

export default function ProfileScreen() {
  const [cats, setCats] = useState<CategoryMeta[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selCat, setSelCat] = useState<string>('');
  const [limitMin, setLimitMin] = useState('60');

  const refresh = async () => {
    try {
      const [c, g] = await Promise.all([api.getCategories(), api.getGoals()]);
      setCats(c);
      setGoals(g);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveGoal = async () => {
    const mins = parseInt(limitMin, 10);
    if (!selCat || isNaN(mins) || mins < 5) {
      Alert.alert('Invalid', 'Pick a category and a limit of at least 5 minutes.');
      return;
    }
    try {
      await api.createGoal(selCat, mins);
      setShowGoalModal(false);
      setSelCat('');
      setLimitMin('60');
      refresh();
    } catch (e) {
      Alert.alert('Error', 'Could not save goal.');
    }
  };

  const removeGoal = async (id: string) => {
    await api.deleteGoal(id);
    refresh();
  };

  const catMap: Record<string, CategoryMeta> = {};
  cats.forEach((c) => (catMap[c.id] = c));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} testID="profile-scroll">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SETTINGS</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profName}>You</Text>
            <Text style={styles.profMeta}>Tracking since today · ScreenSense Pro</Text>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily limits</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowGoalModal(true)}
            testID="add-goal-btn"
          >
            <Plus size={14} color={theme.colors.primary} strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyGoals} testID="goals-empty">
            <Target size={20} color={theme.colors.textMuted} strokeWidth={2} />
            <Text style={styles.emptyText}>
              No daily limits yet. Set one to build healthier habits.
            </Text>
          </View>
        ) : (
          goals.map((g) => {
            const meta = catMap[g.category_id];
            if (!meta) return null;
            return (
              <View
                key={g.id}
                style={styles.goalRow}
                testID={`goal-${g.category_id}`}
              >
                <CategoryIcon
                  name={meta.icon}
                  bg={meta.color + '26'}
                  color={meta.color}
                  rounded={10}
                  size={18}
                />
                <View style={styles.goalBody}>
                  <Text style={styles.goalName}>{meta.name}</Text>
                  <Text style={styles.goalLimit}>
                    {g.daily_limit_minutes} min / day
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeGoal(g.id)}
                  testID={`delete-goal-${g.category_id}`}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={14} color={theme.colors.warning} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Settings list */}
        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 12 }]}>
          Preferences
        </Text>

        <SettingsRow
          icon={<Bell size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Notifications"
          subLabel="Daily summary at 9 PM"
          testID="setting-notifications"
        />
        <SettingsRow
          icon={<Shield size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Privacy"
          subLabel="On-device tracking only"
          testID="setting-privacy"
        />
        <SettingsRow
          icon={<HelpCircle size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Help & feedback"
          subLabel="Reach out to support"
          testID="setting-help"
        />

        <Text style={styles.footerText}>ScreenSense · v1.0 · Preview build</Text>
      </ScrollView>

      {/* Goal Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={showGoalModal}
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modal} testID="goal-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New daily limit</Text>
              <TouchableOpacity
                onPress={() => setShowGoalModal(false)}
                testID="close-goal-modal"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
            >
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  testID={`pick-cat-${c.id}`}
                  onPress={() => setSelCat(c.id)}
                  style={[
                    styles.catPick,
                    selCat === c.id && {
                      borderColor: c.color,
                      backgroundColor: c.color + '22',
                    },
                  ]}
                >
                  <View style={[styles.catPickDot, { backgroundColor: c.color }]} />
                  <Text
                    style={[
                      styles.catPickText,
                      selCat === c.id && { color: theme.colors.text, fontWeight: '700' },
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>
              MINUTES PER DAY
            </Text>
            <TextInput
              testID="goal-minutes-input"
              style={styles.modalInput}
              value={limitMin}
              onChangeText={setLimitMin}
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textMuted}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveGoal}
              testID="save-goal-btn"
            >
              <Text style={styles.saveBtnText}>Save limit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SettingsRow = ({
  icon,
  label,
  subLabel,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  testID: string;
}) => (
  <TouchableOpacity style={styles.settingsRow} testID={testID} activeOpacity={0.7}>
    <View style={styles.settingsIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.settingsLabel}>{label}</Text>
      {subLabel ? <Text style={styles.settingsSub}>{subLabel}</Text> : null}
    </View>
    <ChevronRight size={16} color={theme.colors.textMuted} strokeWidth={2} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { padding: 20, paddingBottom: 110 },
  header: { marginBottom: 20, marginTop: 4 },
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryDim,
    borderWidth: 1,
    borderColor: theme.colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: theme.colors.primary, fontSize: 18, fontWeight: '800' },
  profName: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginLeft: 4 },
  profMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2, marginLeft: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryDim,
  },
  addBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyGoals: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  goalBody: { flex: 1, marginLeft: 10 },
  goalName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  goalLimit: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  settingsLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  settingsSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  modalLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 8,
  },
  catPick: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
    marginRight: 8,
  },
  catPickDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  catPickText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
