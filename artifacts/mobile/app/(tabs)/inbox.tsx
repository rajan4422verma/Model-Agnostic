import { Feather } from "@expo/vector-icons";
import { useIsDark } from "@/hooks/useIsDark";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/constants/colors";
import { Task, useTaskContext } from "@/context/TaskContext";
import { formatDuration, todayStr } from "@/utils/dateUtils";


function TaskCard({
  task,
  isDark,
  onPress,
  onDelete,
  onSchedule,
}: {
  task: Task;
  isDark: boolean;
  onPress: () => void;
  onDelete: () => void;
  onSchedule: () => void;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.taskCard, { backgroundColor: colors.cardBackground }]}
      activeOpacity={0.85}
    >
      {/* Left colored strip */}
      <View style={[styles.cardStrip, { backgroundColor: task.colorValue }]} />

      {/* Icon */}
      <View style={[styles.cardIcon, { backgroundColor: task.colorValue + "30" }]}>
        <View style={[styles.cardIconDot, { backgroundColor: task.colorValue }]} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.notes ? (
          <Text style={[styles.cardNotes, { color: colors.tertiaryLabel }]} numberOfLines={1}>
            {task.notes}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Feather name="clock" size={11} color={colors.tertiaryLabel} />
          <Text style={[styles.cardMetaText, { color: colors.tertiaryLabel }]}>
            {formatDuration(task.durationMinutes)}
          </Text>
          <View style={[styles.badge, { backgroundColor: task.colorValue + "20" }]}>
            <Text style={[styles.badgeText, { color: task.colorValue }]}>Inbox</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={onSchedule}
          style={[styles.actionBtn, { backgroundColor: AppColors.light.primaryBg }]}
        >
          <Feather name="calendar" size={16} color={AppColors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.actionBtn, { backgroundColor: colors.separator }]}
        >
          <Feather name="x" size={16} color={colors.tertiaryLabel} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 120 : insets.bottom + 100;

  const { inboxTasks, deleteFromInbox, scheduleFromInbox, hapticsEnabled } = useTaskContext();

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Remove Task", "Remove this task from your inbox?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteFromInbox(id);
          },
        },
      ]);
    },
    [deleteFromInbox, hapticsEnabled]
  );

  const handleSchedule = useCallback(
    (id: string) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const startTime = new Date(todayStr() + "T09:00:00").toISOString();
      scheduleFromInbox(id, startTime, todayStr());
    },
    [scheduleFromInbox, hapticsEnabled]
  );

  const handleAdd = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/task-create", params: { inbox: "true" } });
  }, [hapticsEnabled]);

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: topPad + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title + add */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.label }]}>Tasks</Text>
            <Text style={[styles.pageSub, { color: colors.tertiaryLabel }]}>
              {inboxTasks.length} unscheduled {inboxTasks.length === 1 ? "task" : "tasks"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: AppColors.light.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {inboxTasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.emptyIcon, { backgroundColor: AppColors.light.primaryBg }]}>
              <Feather name="check-square" size={30} color={AppColors.light.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.label }]}>All clear!</Text>
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              Tasks you haven't scheduled yet will appear here.
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.emptyBtn, { backgroundColor: AppColors.light.primary }]}
            >
              <Feather name="plus" size={14} color="#FFF" />
              <Text style={styles.emptyBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {inboxTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                onPress={() => router.push({ pathname: "/task-detail", params: { taskId: task.id, fromInbox: "true" } })}
                onDelete={() => handleDelete(task.id)}
                onSchedule={() => handleSchedule(task.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  titleRow: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 16,
  },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
    shadowColor: AppColors.light.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },

  list: { paddingHorizontal: 16, gap: 10 },

  taskCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardStrip: { width: 4, alignSelf: "stretch" },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    margin: 12, marginRight: 0, flexShrink: 0,
  },
  cardIconDot: { width: 14, height: 14, borderRadius: 7 },
  cardContent: { flex: 1, padding: 12, paddingLeft: 10, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardNotes: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMetaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", gap: 6, paddingRight: 12 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  emptyCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 32,
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
});
