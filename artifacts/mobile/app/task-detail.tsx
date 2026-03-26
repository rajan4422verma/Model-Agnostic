import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
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

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

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

  return (
    <View style={[styles.subtaskRow, { borderBottomColor: colors.separator }]}>
      <TouchableOpacity onPress={onToggle} style={styles.subtaskCheck} activeOpacity={0.7}>
        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: subtask.isCompleted ? AppColors.primaryBlue : "transparent",
              borderColor: subtask.isCompleted ? AppColors.primaryBlue : colors.tertiaryLabel,
            },
          ]}
        >
          {subtask.isCompleted && <Feather name="check" size={12} color="#FFF" />}
        </View>
      </TouchableOpacity>
      <Text
        style={[
          styles.subtaskText,
          {
            color: colors.label,
            textDecorationLine: subtask.isCompleted ? "line-through" : "none",
            opacity: subtask.isCompleted ? 0.5 : 1,
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

export default function TaskDetailScreen() {
  const { taskId, fromInbox } = useLocalSearchParams<{ taskId: string; fromInbox?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { tasks, inboxTasks, updateTask, deleteTask, deleteFromInbox, toggleTaskCompletion, hapticsEnabled, timeFormat } = useTaskContext();

  const allTasks = [...tasks, ...inboxTasks];
  const task = allTasks.find((t) => t.id === taskId);

  const [newSubtask, setNewSubtask] = useState("");

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
        <Text style={[styles.notFound, { color: colors.label }]}>Task not found</Text>
      </View>
    );
  }

  const handleToggleComplete = useCallback(() => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTaskCompletion(task.id);
    router.back();
  }, [task.id, toggleTaskCompletion, hapticsEnabled]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Task", "This task will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (fromInbox === "true") {
            deleteFromInbox(task.id);
          } else {
            deleteTask(task.id);
          }
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
    const updated = { ...task, subtasks: [...task.subtasks, newSub] };
    updateTask(updated);
    setNewSubtask("");
  }, [newSubtask, task, updateTask]);

  const handleToggleSubtask = useCallback(
    (subId: string) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated: Task = {
        ...task,
        subtasks: task.subtasks.map((s) => (s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s)),
      };
      updateTask(updated);
    },
    [task, updateTask, hapticsEnabled]
  );

  const handleDeleteSubtask = useCallback(
    (subId: string) => {
      const updated: Task = {
        ...task,
        subtasks: task.subtasks.filter((s) => s.id !== subId),
      };
      updateTask(updated);
    },
    [task, updateTask]
  );

  const completedSubs = task.subtasks.filter((s) => s.isCompleted).length;
  const recurrenceLabel = {
    none: "Does not repeat",
    daily: "Every day",
    weekdays: "Weekdays",
    weekly: "Every week",
    custom: "Custom",
  }[task.recurrence];

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Sheet handle */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.separator }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.secondaryLabel} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleComplete} style={[styles.completeBtn, { borderColor: task.colorValue }]}>
            <Text style={[styles.completeBtnText, { color: task.colorValue }]}>
              {task.isCompleted ? "Undo" : "Done"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Feather name="trash-2" size={20} color={colors.tertiaryLabel} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Color accent */}
        <View style={[styles.colorBar, { backgroundColor: task.colorValue }]} />

        {/* Title */}
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.taskTitle,
              {
                color: colors.label,
                textDecorationLine: task.isCompleted ? "line-through" : "none",
                opacity: task.isCompleted ? 0.5 : 1,
              },
            ]}
          >
            {task.title}
          </Text>
        </View>

        {/* Meta info */}
        <View style={[styles.metaCard, { backgroundColor: colors.cardBackground }]}>
          {task.startTime && (
            <View style={[styles.metaRow, { borderBottomColor: colors.separator }]}>
              <Feather name="clock" size={18} color={task.colorValue} />
              <Text style={[styles.metaText, { color: colors.label }]}>
                {formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
              </Text>
              <Text style={[styles.metaBadge, { backgroundColor: task.colorValue + "22", color: task.colorValue }]}>
                {formatDuration(task.durationMinutes)}
              </Text>
            </View>
          )}
          {!task.startTime && (
            <View style={[styles.metaRow, { borderBottomColor: colors.separator }]}>
              <Feather name="inbox" size={18} color={colors.tertiaryLabel} />
              <Text style={[styles.metaText, { color: colors.tertiaryLabel }]}>Unscheduled</Text>
            </View>
          )}
          <View style={[styles.metaRow, { borderBottomColor: colors.separator }]}>
            <Feather name="repeat" size={18} color={colors.tertiaryLabel} />
            <Text style={[styles.metaText, { color: colors.label }]}>{recurrenceLabel}</Text>
          </View>
          <View style={[styles.metaRow, { borderBottomColor: "transparent" }]}>
            <Feather name="target" size={18} color={colors.tertiaryLabel} />
            <Text style={[styles.metaText, { color: colors.label }]}>
              {formatDuration(task.durationMinutes)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {task.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.secondaryLabel }]}>{task.notes}</Text>
          </View>
        ) : null}

        {/* Subtasks */}
        <View style={styles.subtasksSection}>
          <View style={styles.subtasksHeader}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>SUBTASKS</Text>
            {task.subtasks.length > 0 && (
              <Text style={[styles.subtasksCount, { color: colors.tertiaryLabel }]}>
                {completedSubs}/{task.subtasks.length}
              </Text>
            )}
          </View>

          {task.subtasks.length > 0 && (
            <View style={[styles.subtasksList, { backgroundColor: colors.cardBackground }]}>
              {task.subtasks.map((sub) => (
                <SubtaskRow
                  key={sub.id}
                  subtask={sub}
                  onToggle={() => handleToggleSubtask(sub.id)}
                  onDelete={() => handleDeleteSubtask(sub.id)}
                  isDark={isDark}
                />
              ))}
            </View>
          )}

          <View style={[styles.addSubtaskRow, { backgroundColor: colors.cardBackground }]}>
            <TextInput
              style={[styles.addSubtaskInput, { color: colors.label }]}
              placeholder="Add subtask..."
              placeholderTextColor={colors.tertiaryLabel}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
            />
            {newSubtask.length > 0 && (
              <TouchableOpacity onPress={handleAddSubtask} style={styles.addSubtaskBtn}>
                <Feather name="plus" size={20} color={AppColors.primaryBlue} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handleContainer: {
    paddingTop: 8,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  completeBtn: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  completeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    flex: 1,
    textAlign: "center",
    marginTop: 100,
    fontSize: 18,
    fontFamily: "Inter_400Regular",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  colorBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  titleSection: {
    paddingVertical: 4,
  },
  taskTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  metaCard: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  metaText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    overflow: "hidden",
  },
  notesCard: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  subtasksSection: { gap: 8 },
  subtasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subtasksCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  subtasksList: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  subtaskCheck: {
    flexShrink: 0,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  subtaskText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  addSubtaskRow: {
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  addSubtaskInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  addSubtaskBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
