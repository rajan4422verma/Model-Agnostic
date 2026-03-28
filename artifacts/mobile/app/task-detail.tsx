import { Feather } from "@expo/vector-icons";
import { useIsDark } from "@/hooks/useIsDark";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/constants/colors";
import { Subtask, Task, useTaskContext } from "@/context/TaskContext";
import { formatDuration, formatTimeRange } from "@/utils/dateUtils";

function SubtaskRow({
  subtask,
  onToggle,
  onDelete,
  isDark,
}: {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const scale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    onToggle();
  };

  return (
    <View style={[styles.subtaskRow, { borderBottomColor: colors.separator }]}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
        <Animated.View
          style={[
            styles.checkbox,
            {
              borderColor: subtask.isCompleted ? AppColors.primary : colors.tertiaryLabel,
              backgroundColor: subtask.isCompleted ? AppColors.primary : "transparent",
              transform: [{ scale }],
            },
          ]}
        >
          {subtask.isCompleted && <Feather name="check" size={11} color="#FFF" />}
        </Animated.View>
      </TouchableOpacity>
      <Text
        style={[
          styles.subtaskText,
          {
            color: subtask.isCompleted ? colors.tertiaryLabel : colors.label,
            textDecorationLine: subtask.isCompleted ? "line-through" : "none",
            flex: 1,
          },
        ]}
      >
        {subtask.title}
      </Text>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="x" size={16} color={colors.tertiaryLabel} />
      </TouchableOpacity>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
  onPress,
  isDark,
  isLast,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isDark: boolean;
  isLast?: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={[
        styles.metaRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <Feather name={icon as any} size={17} color={colors.tertiaryLabel} />
      <Text style={[styles.metaLabel, { color: colors.label }]}>{label}</Text>
      {value && (
        <Text style={[styles.metaValue, { color: colors.tertiaryLabel }]}>{value}</Text>
      )}
      {onPress && (
        <Feather name="chevron-right" size={15} color={colors.tertiaryLabel} />
      )}
    </TouchableOpacity>
  );
}

export default function TaskDetailScreen() {
  const { taskId, fromInbox } = useLocalSearchParams<{ taskId: string; fromInbox?: string }>();
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const colors = isDark ? AppColors.dark : AppColors.light;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    tasks,
    inboxTasks,
    updateTask,
    deleteTask,
    deleteFromInbox,
    toggleTaskCompletion,
    hapticsEnabled,
    timeFormat,
  } = useTaskContext();

  const allTasks = [...tasks, ...inboxTasks];
  const task = allTasks.find((t) => t.id === taskId);
  const [newSubtask, setNewSubtask] = useState("");

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.tertiaryLabel, fontFamily: 'Inter_400Regular', fontSize: 16 }}>Task not found</Text>
      </View>
    );
  }

  const isCompleted = task.isCompleted;
  const completedSubs = task.subtasks.filter((s) => s.isCompleted).length;
  const recurrenceLabel: Record<string, string> = {
    none: "Does not repeat",
    daily: "Every day",
    weekdays: "Weekdays",
    weekly: "Every week",
    custom: "Custom",
  };

  const handleToggle = useCallback(() => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTaskCompletion(task.id);
  }, [task.id, toggleTaskCompletion, hapticsEnabled]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Task", "This task will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (hapticsEnabled)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          fromInbox === "true" ? deleteFromInbox(task.id) : deleteTask(task.id);
          router.back();
        },
      },
    ]);
  }, [task.id, deleteTask, deleteFromInbox, fromInbox, hapticsEnabled]);

  const handleAddSubtask = useCallback(() => {
    const title = newSubtask.trim();
    if (!title) return;
    const newSub: Subtask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      isCompleted: false,
    };
    updateTask({ ...task, subtasks: [...task.subtasks, newSub] });
    setNewSubtask("");
  }, [newSubtask, task, updateTask]);

  const handleToggleSub = useCallback(
    (id: string) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateTask({
        ...task,
        subtasks: task.subtasks.map((s) =>
          s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
        ),
      });
    },
    [task, updateTask, hapticsEnabled]
  );

  const handleDeleteSub = useCallback(
    (id: string) => {
      updateTask({ ...task, subtasks: task.subtasks.filter((s) => s.id !== id) });
    },
    [task, updateTask]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Sheet handle */}
      <View style={styles.handle}>
        <View style={[styles.handleBar, { backgroundColor: isCompleted ? colors.tertiaryLabel : task.colorValue }]} />
      </View>

      {/* Large colored header */}
      <View style={[styles.heroHeader, { backgroundColor: task.colorValue }]}>
        {/* Top row: close + delete */}
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.heroBtn}>
            <Feather name="trash-2" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Icon + Title row */}
        <View style={styles.heroContent}>
          <View style={styles.heroIconCircle}>
            <View style={[styles.heroIconDot, { backgroundColor: task.colorValue }]} />
          </View>
          <View style={styles.heroTitleBlock}>
            {task.startTime && (
              <Text style={styles.heroTime}>
                {formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
              </Text>
            )}
            <Text style={styles.heroTitle} numberOfLines={2}>
              {task.title}
            </Text>
            {task.subtasks.length > 0 && (
              <Text style={styles.heroSubCount}>
                {completedSubs}/{task.subtasks.length} subtasks
              </Text>
            )}
          </View>
          {/* Completion ring */}
          <TouchableOpacity onPress={handleToggle} style={styles.heroRing}>
            <View
              style={[
                styles.heroRingCircle,
                {
                  borderColor: "rgba(255,255,255,0.7)",
                  backgroundColor: isCompleted ? "rgba(255,255,255,0.9)" : "transparent",
                },
              ]}
            >
              {isCompleted && <Feather name="check" size={18} color={task.colorValue} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Meta info card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <MetaRow
            icon="calendar"
            label={new Date(task.date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            value={isCompleted ? "Done" : "Today"}
            isDark={isDark}
          />
          {task.startTime && (
            <MetaRow
              icon="clock"
              label={formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
              value={formatDuration(task.durationMinutes)}
              isDark={isDark}
            />
          )}
          <MetaRow
            icon="bell"
            label="Alerts"
            value={task.notificationMinutesBefore > 0 ? `${task.notificationMinutesBefore} min before` : "None"}
            isDark={isDark}
          />
          <MetaRow
            icon="repeat"
            label={recurrenceLabel[task.recurrence] ?? "Does not repeat"}
            isDark={isDark}
            isLast
          />
        </View>

        {/* Notes */}
        {task.notes ? (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardPadded}>
              <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>NOTES</Text>
              <Text style={[styles.notesText, { color: colors.secondaryLabel }]}>
                {task.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Subtasks */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          {task.subtasks.map((sub, idx) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              onToggle={() => handleToggleSub(sub.id)}
              onDelete={() => handleDeleteSub(sub.id)}
              isDark={isDark}
            />
          ))}

          {/* Add subtask input */}
          <View style={[styles.addSubRow, { borderTopColor: task.subtasks.length > 0 ? colors.separator : 'transparent', borderTopWidth: task.subtasks.length > 0 ? StyleSheet.hairlineWidth : 0 }]}>
            <View style={[styles.addSubIcon, { backgroundColor: colors.separator }]}>
              <Feather name="plus" size={12} color={colors.tertiaryLabel} />
            </View>
            <TextInput
              style={[styles.addSubInput, { color: colors.label }]}
              placeholder="Add Subtask"
              placeholderTextColor={colors.tertiaryLabel}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
            />
            {newSubtask.length > 0 && (
              <TouchableOpacity onPress={handleAddSubtask}>
                <Feather name="arrow-right-circle" size={22} color={AppColors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={handleToggle}
          style={[styles.actionBtn, { backgroundColor: task.colorValue }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {isCompleted ? "Mark Incomplete" : "Mark as Done"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: { paddingTop: 10, alignItems: "center" },
  handleBar: { width: 36, height: 4, borderRadius: 2 },

  heroHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroIconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  heroTitleBlock: { flex: 1 },
  heroTime: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
    lineHeight: 28,
  },
  heroSubCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  heroRing: { paddingLeft: 6 },
  heroRingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPadded: { padding: 16, gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    minHeight: 50,
  },
  metaLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  metaValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  subtaskText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },

  addSubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  addSubIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addSubInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 2,
  },

  actionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
});
