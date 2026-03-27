import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Animated,
  Platform,
  Pressable,
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
import { formatDuration, formatTimeRange, isToday, todayStr } from "@/utils/dateUtils";

// ── Shared header (dark bar) ──────────────────────────────────────────────────
function AppHeader({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <View style={styles.darkHeader}>
      <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
        <Feather name="menu" size={22} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Feather name="user" size={18} color="#FFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Completion ring ───────────────────────────────────────────────────────────
function CompletionRing({
  completed,
  color,
  onPress,
}: {
  completed: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.8, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    onPress();
  };
  return (
    <TouchableOpacity onPress={handlePress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: completed ? color : "#D2D4D8",
            backgroundColor: completed ? color : "transparent",
            transform: [{ scale }],
          },
        ]}
      >
        {completed && <Feather name="check" size={11} color="#FFF" />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({
  task,
  timeFormat,
  onPress,
  onToggle,
  isDark,
}: {
  task: Task;
  timeFormat: "12h" | "24h";
  onPress: () => void;
  onToggle: () => void;
  isDark: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;

  return (
    <Pressable onPress={onPress} style={styles.taskRow}>
      {/* Colored icon circle */}
      <View style={[styles.taskIcon, { backgroundColor: task.colorValue + "40" }]}>
        <View style={[styles.taskIconDot, { backgroundColor: task.colorValue }]} />
      </View>

      {/* Content */}
      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            {
              color: task.isCompleted ? colors.tertiaryLabel : colors.label,
              textDecorationLine: task.isCompleted ? "line-through" : "none",
            },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          {task.startTime && (
            <View style={styles.taskMetaItem}>
              <Feather name="clock" size={11} color={colors.tertiaryLabel} />
              <Text style={[styles.taskMetaText, { color: colors.tertiaryLabel }]}>
                {formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
              </Text>
            </View>
          )}
          <View style={[styles.sourceBadge, { backgroundColor: task.colorValue + "20" }]}>
            <Text style={[styles.sourceBadgeText, { color: task.colorValue }]}>
              {formatDuration(task.durationMinutes)}
            </Text>
          </View>
        </View>
      </View>

      <CompletionRing completed={task.isCompleted} color={task.colorValue} onPress={onToggle} />
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const { selectedDate, getTasksForDate, toggleTaskCompletion, hapticsEnabled, timeFormat } =
    useTaskContext();

  const today = todayStr();
  const dayTasks = useMemo(() => getTasksForDate(today), [today, getTasksForDate]);
  const upcomingTasks = useMemo(
    () => dayTasks.filter((t) => !t.isCompleted).sort((a, b) => (a.startTime! > b.startTime! ? 1 : -1)),
    [dayTasks]
  );
  const completedTasks = useMemo(() => dayTasks.filter((t) => t.isCompleted), [dayTasks]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleToggle = useCallback(
    (id: string) => {
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toggleTaskCompletion(id);
    },
    [hapticsEnabled, toggleTaskCompletion]
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: "/task-detail", params: { taskId: task.id } });
    },
    [hapticsEnabled]
  );

  const handleAdd = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/task-create", params: { date: today } });
  }, [today, hapticsEnabled]);

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Dark header */}
      <View style={{ paddingTop: topPad }}>
        <AppHeader title="The Mindful Canvas" isDark={isDark} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's date + add */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionHeading, { color: colors.label }]}>Today's Schedule</Text>
            <Text style={[styles.sectionSub, { color: colors.tertiaryLabel }]}>{todayLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: AppColors.light.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Upcoming tasks */}
        {upcomingTasks.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            {upcomingTasks.map((task, idx) => (
              <View key={task.id}>
                <TaskRow
                  task={task}
                  timeFormat={timeFormat}
                  onPress={() => handleTaskPress(task)}
                  onToggle={() => handleToggle(task.id)}
                  isDark={isDark}
                />
                {idx < upcomingTasks.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.separator }]} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <Feather name="sun" size={28} color={AppColors.light.primaryLight} />
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              No tasks scheduled for today
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.emptyBtn, { backgroundColor: AppColors.light.primaryBg }]}
            >
              <Text style={[styles.emptyBtnText, { color: AppColors.light.primary }]}>
                Add your first task
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed today */}
        {completedTasks.length > 0 && (
          <>
            <View style={styles.sectionHeaderSmall}>
              <Text style={[styles.sectionHeadingSmall, { color: colors.label }]}>
                Completed Today
              </Text>
              <Text style={[styles.sectionCount, { color: AppColors.light.primary }]}>
                {completedTasks.length}
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              {completedTasks.map((task, idx) => (
                <View key={task.id}>
                  <TaskRow
                    task={task}
                    timeFormat={timeFormat}
                    onPress={() => handleTaskPress(task)}
                    onToggle={() => handleToggle(task.id)}
                    isDark={isDark}
                  />
                  {idx < completedTasks.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.separator }]} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bottom banner */}
        <View style={styles.bottomBanner}>
          <Text style={styles.bannerText}>
            Everything in one place.{"\n"}
            <Text style={{ color: AppColors.light.primaryLight }}>One canvas for your whole life.</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  darkHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1C1B1F",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  avatarBtn: { alignItems: "flex-end" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },

  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70 },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskIconDot: { width: 14, height: 14, borderRadius: 7 },
  taskContent: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  taskMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  taskMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sourceBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  ring: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeadingSmall: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionCount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    backgroundColor: AppColors.light.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  bottomBanner: {
    margin: 16,
    backgroundColor: "#1C1B1F",
    borderRadius: 16,
    padding: 24,
  },
  bannerText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 26,
  },
});
