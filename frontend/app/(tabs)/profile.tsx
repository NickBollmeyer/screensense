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
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Target,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Moon,
  Clock,
  Crown,
  Star,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { api, CategoryMeta, Goal, FocusMode } from '../../src/api';
import CategoryIcon from '../../src/components/CategoryIcon';
import SwipeableTab from '../../src/components/SwipeableTab';

const PRIVACY_URL = 'https://screensense-app.vercel.app/privacy';
const TERMS_URL = 'https://screensense-app.vercel.app/terms';
const SUPPORT_EMAIL = 'hello@screensense.app';
// Until ScreenSense is published on the Play Store this URL returns "item not
// found". Flip APP_PUBLISHED to true after your first production release.
const APP_PUBLISHED_ON_PLAY = false;
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.screensense.android';

export default function ProfileScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<CategoryMeta[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [focus, setFocus] = useState<FocusMode | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [selCat, setSelCat] = useState<string>('');
  const [limitMin, setLimitMin] = useState('60');

  const refresh = async () => {
    try {
      const [c, g, f] = await Promise.all([
        api.getCategories(),
        api.getGoals(),
        api.getFocusMode(),
      ]);
      setCats(c);
      setGoals(g);
      setFocus(f);
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
    } catch {
      Alert.alert('Error', 'Could not save goal.');
    }
  };

  const removeGoal = async (id: string) => {
    await api.deleteGoal(id);
    refresh();
  };

  const toggleFocusEnabled = async (val: boolean) => {
    if (!focus) return;
    setFocus({ ...focus, enabled: val });
    try {
      await api.updateFocusMode({ enabled: val });
    } catch {
      setFocus(focus); // revert
    }
  };

  const setHour = async (key: 'start_hour' | 'end_hour', val: number) => {
    if (!focus) return;
    const updated = { ...focus, [key]: val };
    setFocus(updated);
    await api.updateFocusMode({ [key]: val });
  };

  const toggleSilenced = async (catId: string) => {
    if (!focus) return;
    const next = focus.silenced_categories.includes(catId)
      ? focus.silenced_categories.filter((c) => c !== catId)
      : [...focus.silenced_categories, catId];
    setFocus({ ...focus, silenced_categories: next });
    await api.updateFocusMode({ silenced_categories: next });
  };

  const catMap: Record<string, CategoryMeta> = {};
  cats.forEach((c) => (catMap[c.id] = c));

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
  };

  return (
    <SwipeableTab>
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
            <Text style={styles.profMeta}>
              Tracking since today · ScreenSense Pro
            </Text>
          </View>
        </View>

        {/* Focus Mode */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Focus mode</Text>
          {focus?.enabled && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.focusCard} testID="focus-mode-card">
          <View style={styles.focusTopRow}>
            <View style={styles.focusIconBox}>
              <Moon size={18} color={theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>Focus hours</Text>
              <Text style={styles.focusSubtitle}>
                Silence selected categories during work
              </Text>
            </View>
            <Switch
              testID="focus-toggle"
              value={focus?.enabled ?? false}
              onValueChange={toggleFocusEnabled}
              trackColor={{
                false: theme.colors.surface,
                true: theme.colors.primary + '88',
              }}
              thumbColor={focus?.enabled ? theme.colors.primary : '#666'}
            />
          </View>

          <TouchableOpacity
            style={styles.focusRow}
            onPress={() => setShowFocusModal(true)}
            testID="focus-config-btn"
          >
            <Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.focusRowText}>
              {focus
                ? `${formatHour(focus.start_hour)} → ${formatHour(focus.end_hour)}`
                : '—'}
            </Text>
            <Text style={styles.focusRowMeta}>
              {focus?.silenced_categories.length ?? 0} silenced
            </Text>
            <ChevronRight size={14} color={theme.colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
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
          ScreenSense Pro
        </Text>

        <SettingsRow
          icon={<Crown size={18} color="#FFD60A" strokeWidth={2.2} />}
          label="View plans & pricing"
          subLabel="Founders Lifetime, Annual or Monthly"
          tint="#FFD60A"
          testID="setting-view-pro"
          onPress={() => router.push('/paywall')}
        />
        <SettingsRow
          icon={<Star size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Rate ScreenSense"
          subLabel={
            APP_PUBLISHED_ON_PLAY
              ? 'Help others discover the app'
              : 'Coming soon — once we hit the Play Store'
          }
          testID="setting-rate"
          onPress={() => {
            if (APP_PUBLISHED_ON_PLAY) {
              Linking.openURL(PLAY_STORE_URL).catch(() => {});
            } else {
              Alert.alert(
                'Almost there!',
                "ScreenSense isn't on the Play Store yet — you're using the preview build. Once we publish, this button will open the rating page.",
                [{ text: 'OK' }]
              );
            }
          }}
        />

        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 12 }]}>
          Preferences
        </Text>

        <SettingsRow
          icon={<Bell size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Notifications"
          subLabel="Manage in system settings"
          testID="setting-notifications"
          onPress={() => Linking.openSettings()}
        />
        <SettingsRow
          icon={<Shield size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Privacy policy"
          subLabel="On-device tracking only"
          testID="setting-privacy"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <SettingsRow
          icon={<Shield size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Terms of service"
          subLabel="Rules of the road"
          testID="setting-terms"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
        <SettingsRow
          icon={<HelpCircle size={18} color={theme.colors.text} strokeWidth={2} />}
          label="Help & feedback"
          subLabel={`Email ${SUPPORT_EMAIL}`}
          testID="setting-help"
          onPress={() => {
            const body = encodeURIComponent(
              'Hey ScreenSense team,\n\n[Your feedback or question here]\n\n— Sent from ScreenSense v1.1'
            );
            const subject = encodeURIComponent('ScreenSense feedback');
            Linking.openURL(
              `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
            ).catch(() =>
              Alert.alert(
                'No mail app',
                `Please email us at ${SUPPORT_EMAIL}`
              )
            );
          }}
        />

        <Text style={styles.footerText}>ScreenSense · v1.1 · Preview build</Text>
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
                      selCat === c.id && {
                        color: theme.colors.text,
                        fontWeight: '700',
                      },
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

      {/* Focus Mode Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={showFocusModal}
        onRequestClose={() => setShowFocusModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modal} testID="focus-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Focus hours</Text>
              <TouchableOpacity
                onPress={() => setShowFocusModal(false)}
                testID="close-focus-modal"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>START</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourRow}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <TouchableOpacity
                  key={h}
                  testID={`start-hour-${h}`}
                  onPress={() => setHour('start_hour', h)}
                  style={[
                    styles.hourPick,
                    focus?.start_hour === h && styles.hourPickActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.hourText,
                      focus?.start_hour === h && styles.hourTextActive,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>END</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourRow}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <TouchableOpacity
                  key={h}
                  testID={`end-hour-${h}`}
                  onPress={() => setHour('end_hour', h)}
                  style={[
                    styles.hourPick,
                    focus?.end_hour === h && styles.hourPickActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.hourText,
                      focus?.end_hour === h && styles.hourTextActive,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>
              SILENCE THESE CATEGORIES
            </Text>
            <View style={styles.silencedGrid}>
              {cats.map((c) => {
                const on = focus?.silenced_categories.includes(c.id) ?? false;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggleSilenced(c.id)}
                    testID={`silence-${c.id}`}
                    style={[
                      styles.catPick,
                      on && {
                        borderColor: c.color,
                        backgroundColor: c.color + '33',
                      },
                    ]}
                  >
                    <View style={[styles.catPickDot, { backgroundColor: c.color }]} />
                    <Text
                      style={[
                        styles.catPickText,
                        on && { color: theme.colors.text, fontWeight: '700' },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setShowFocusModal(false)}
              testID="done-focus-btn"
            >
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </SwipeableTab>
  );
}

const SettingsRow = ({
  icon,
  label,
  subLabel,
  testID,
  onPress,
  rightLabel,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  testID: string;
  onPress?: () => void;
  rightLabel?: string;
  tint?: string;
}) => (
  <TouchableOpacity
    style={styles.settingsRow}
    testID={testID}
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingsIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.settingsLabel, tint ? { color: tint } : null]}>
        {label}
      </Text>
      {subLabel ? <Text style={styles.settingsSub}>{subLabel}</Text> : null}
    </View>
    {rightLabel ? (
      <Text style={styles.settingsRight}>{rightLabel}</Text>
    ) : null}
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
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.accentDim,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginRight: 4,
  },
  activeText: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  focusCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  focusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  focusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryDim,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  focusTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  focusSubtitle: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  focusRowText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 6,
  },
  focusRowMeta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
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
  settingsRight: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
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
    maxHeight: '85%',
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
    marginBottom: 8,
  },
  catPickDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  catPickText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  silencedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  hourRow: { gap: 6, paddingVertical: 8 },
  hourPick: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  hourPickActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  hourText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  hourTextActive: { color: '#FFFFFF' },
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
