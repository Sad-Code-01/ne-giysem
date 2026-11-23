import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PaperPlaneTilt, Sparkle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassButton, ScreenBackground } from '@/components/glass';
import { SettingsHeader } from '@/components/SettingsHeader';
import { useProfile } from '@/hooks/useProfile';
import { useWeatherContext } from '@/hooks/useWeatherContext';
import { sendChatMessage, type ChatMessage } from '@/services/aiService';
import { clearAiApiKey, getAiApiKey, setAiApiKey } from '@/storage/aiKey';
import { t } from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { MIN_TOUCH_SIZE, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface UiMessage extends ChatMessage {
  id: string;
}

let messageSeq = 0;
function nextId(): string {
  messageSeq += 1;
  return `m${messageSeq}`;
}

/** AI Asistan: kullanıcının kendi EVREN API anahtarıyla çalışan sohbet. */
export default function AssistantScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { outfitProfile } = useProfile();
  const { snapshot } = useWeatherContext();

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyEditor, setShowKeyEditor] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<UiMessage>>(null);

  useEffect(() => {
    let live = true;
    void getAiApiKey().then((key) => {
      if (live) setHasKey(Boolean(key));
    });
    return () => {
      live = false;
    };
  }, []);

  const saveKey = async (): Promise<void> => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    await setAiApiKey(trimmed);
    setKeyInput('');
    setHasKey(true);
    setShowKeyEditor(false);
  };

  const removeKey = (): void => {
    Alert.alert(t('ai.removeTitle'), t('ai.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void clearAiApiKey().then(() => {
            setHasKey(false);
            setMessages([]);
          });
        },
      },
    ]);
  };

  const send = async (): Promise<void> => {
    const text = input.trim();
    if (!text || sending || !hasKey) return;

    const userMsg: UiMessage = { id: nextId(), role: 'user', content: text };
    const history: ChatMessage[] = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: text },
    ];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const reply = await sendChatMessage(history, snapshot, outfitProfile);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }]);
    } catch (e) {
      const missing = e instanceof Error && e.message === 'AI_API_KEY_MISSING';
      setError(missing ? t('ai.errorNoKey') : t('ai.errorGeneric'));
      setHasKey((prev) => (missing ? false : prev));
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const renderMessage = ({ item }: { item: UiMessage }) => {
    const mine = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowEnd : styles.bubbleRowStart]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: mine ? theme.primary : theme.surface,
              borderColor: mine ? theme.primary : theme.line,
            },
          ]}
        >
          <Text style={[typography.body, { color: mine ? '#FFFFFF' : theme.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenBackground kind="partly">
      <SettingsHeader title={t('ai.title')} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <View style={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* API anahtarı kartı */}
          <Glass>
            {hasKey === null ? (
              <ActivityIndicator color={theme.tabActive} />
            ) : hasKey && !showKeyEditor ? (
              <View style={styles.keyRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.body, { color: theme.text }]}>{t('ai.keySaved')}</Text>
                  <Text style={[typography.micro, { color: theme.textSecondary }]} maxFontSizeMultiplier={1.3}>
                    {t('ai.keyNote')}
                  </Text>
                </View>
                <Pressable onPress={() => setShowKeyEditor(true)} accessibilityRole="button" style={styles.keyAction}>
                  <Text style={[typography.caption, { color: theme.tabActive }]}>{t('ai.changeKey')}</Text>
                </Pressable>
                <Pressable onPress={removeKey} accessibilityRole="button" style={styles.keyAction}>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('common.delete')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.keyEditor}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('ai.keySetupBody')}</Text>
                <TextInput
                  value={keyInput}
                  onChangeText={setKeyInput}
                  placeholder={t('ai.keyPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.line,
                      backgroundColor: theme.surface,
                    },
                  ]}
                />
                <View style={styles.keyActions}>
                  {hasKey ? (
                    <View style={{ flex: 1 }}>
                      <GlassButton
                        label={t('common.cancel')}
                        variant="secondary"
                        onPress={() => {
                          setShowKeyEditor(false);
                          setKeyInput('');
                        }}
                      />
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <GlassButton
                      label={t('common.done')}
                      onPress={() => void saveKey()}
                      disabled={!keyInput.trim()}
                    />
                  </View>
                </View>
              </View>
            )}
          </Glass>

          {/* Sohbet */}
          {hasKey ? (
            <>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Sparkle size={28} color={theme.tabActive} />
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>
                      {t('ai.emptyHint')}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  sending ? (
                    <View style={styles.bubbleRow}>
                      <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                        <ActivityIndicator size="small" color={theme.tabActive} />
                      </View>
                    </View>
                  ) : undefined
                }
              />
              {error ? (
                <Text style={[typography.caption, { color: theme.text }]}>{error}</Text>
              ) : null}
              <View style={styles.composer}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('ai.inputPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[
                    styles.input,
                    styles.composerInput,
                    { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
                  ]}
                  onSubmitEditing={() => void send()}
                />
                <Pressable
                  onPress={() => void send()}
                  disabled={sending || !input.trim()}
                  accessibilityRole="button"
                  accessibilityLabel={t('ai.send')}
                  style={({ pressed }) => [
                    styles.sendButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: pressed || sending || !input.trim() ? 0.6 : 1,
                    },
                  ]}
                >
                  <PaperPlaneTilt size={18} color="#FFFFFF" weight="fill" />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
  keyAction: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  keyEditor: {
    gap: spacing.sm,
  },
  keyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowEnd: {
    justifyContent: 'flex-end',
  },
  bubbleRowStart: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    fontSize: 15,
  },
  sendButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
