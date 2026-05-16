import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Send, RefreshCw, Trash2 } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { api, ChatMsg } from '../../src/api';
import SwipeableTab from '../../src/components/SwipeableTab';

const QUICK_PROMPTS = [
  'How was my day?',
  'Why am I on social media so much?',
  'Help me cut Instagram time',
  'Build a focus routine for me',
];

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const msgs = await api.listMessages();
      setMessages(msgs);
    } catch (e) {
      console.warn('coach load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    // optimistic
    const tempUser: ChatMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUser]);
    try {
      const res = await api.sendMessage(text);
      setMessages((m) => {
        const filtered = m.filter((x) => x.id !== tempUser.id);
        return [...filtered, res.user_message, res.assistant_message];
      });
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I had trouble responding. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    await api.clearMessages();
    setMessages([]);
  };

  if (loading) {
    return (
      <View style={styles.loader} testID="coach-loading">
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SwipeableTab>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coachAvatar}>
              <Sparkles size={16} color={theme.colors.primary} strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.title}>Coach</Text>
              <Text style={styles.subtitle}>Powered by Claude Sonnet 4.5</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              testID="clear-chat-btn"
              onPress={clearChat}
              style={styles.clearBtn}
            >
              <Trash2 size={14} color={theme.colors.warning} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          testID="coach-thread"
        >
          {messages.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Sparkles size={28} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>Your AI digital wellness coach</Text>
              <Text style={styles.emptyText}>
                Ask anything about your phone habits. Try one of these:
              </Text>
              <View style={styles.prompts}>
                {QUICK_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => send(p)}
                    style={styles.prompt}
                    testID={`quick-prompt-${p.slice(0, 12)}`}
                  >
                    <Text style={styles.promptText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  m.role === 'user' ? styles.userRow : styles.assistantRow,
                ]}
                testID={`msg-${m.role}`}
              >
                {m.role === 'assistant' && (
                  <View style={styles.assistantAvatar}>
                    <Sparkles size={12} color={theme.colors.primary} strokeWidth={2.4} />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      m.role === 'user' && { color: '#FFFFFF' },
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              </View>
            ))
          )}
          {sending && (
            <View style={[styles.msgRow, styles.assistantRow]}>
              <View style={styles.assistantAvatar}>
                <Sparkles size={12} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.typing]}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.textSecondary}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            testID="coach-input"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={theme.colors.textMuted}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            testID="send-btn"
            disabled={!input.trim() || sending}
            onPress={() => send()}
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && { opacity: 0.5 },
            ]}
          >
            {sending ? (
              <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Send size={16} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryDim,
    borderWidth: 1,
    borderColor: theme.colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.warningDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: {
    padding: 16,
    paddingBottom: 110,
    minHeight: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryDim,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  prompts: { width: '100%', gap: 8 },
  prompt: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  promptText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  typing: { paddingVertical: 12, paddingHorizontal: 16 },
  bubbleText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 90,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
