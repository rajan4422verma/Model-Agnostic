import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Animated,
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
import { addDays, formatTime, formatDuration, getDayName, getDayNumber, getWeekDays, isToday, todayStr } from "@/utils/dateUtils";

// ── Category mapping ──────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  "#AECBFA": { label: "DEEP WORK",  icon: "briefcase", color: "#1A73E8" },
  "#A8D8A8": { label: "CREATIVE",   icon: "edit-2",    color: "#2E7D52" },
  "#F9D5A7": { label: "ADMIN",      icon: "mail",      color: "#E67700" },
  "#C4B5E8": { label: "PLANNING",   icon: "layers",    color: "#7B5EA7" },
  "#F5B4B6": { label: "WELLNESS",   icon: "heart",     color: "#C2515E" },
  "#A8D5E2": { label: "FOCUS",      icon: "target",    color: "#0277BD" },
  "#F4B8D0": { label: "PERSONAL",   icon: "user",      color: "#AD1457" },
  "#B5D5C5": { label: "HEALTH",     icon: "activity",  color: "#2E7D32" },
  "#FDD8AA": { label: "MEETINGS",   icon: "users",     color: "#D84315" },
};

function getCategory(colorValue: string) {
  return CATEGORY_MAP[colorValue] ?? { label: "TASK", icon: "check-square", color: "#5F6368" };
}

// ── Card background color ──────────────────────────────────────────────────────
function getCardBg(colorValue: string, isDark: boolean) {
  if (isDark) return AppColors.dark.cardBackground;
  const map: Record<string, string> = {
    "#F5B4B6": "#FEF1F2",
    "#F4B8D0": "#FEF1F5",
    "#A8D8A8": "#F0FAF2",
    "#B5D5C5": "#F0FAF5",
    "#AECBFA": "#F0F6FF",
    "#A8D5E2": "#F0F9FF",
    "#C4B5E8": "#F5F0FF",
    "#F9D5A7": "#FFF8F0",
    "#FDD8AA": "#FFF8EE",
  };
  return map[colorValue] ?? "#FFFFFF";
}

// ── Week day strip ────────────────────────────────────────────────────────────
function WeekStrip({
  selectedDate,
  onSelect,
  isDark,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
  isDark: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const today = todayStr();
  const days = getWeekDays(selectedDate, 1).slice(0, 7);

  return (
    <View style={weekStyles.row}>
      {days.map((d) => {
        const isSelected = d === selectedDate;
        const isT = d === today;
        return (
          <TouchableOpacity
            key={d}
            onPress={() => onSelect(d)}
            style={weekStyles.cell}
            activeOpacity={0.7}
          >
            <Text style={[weekStyles.dayName, { color: isSelected ? AppColors.light.primary : colors.tertiaryLabel }]}>
              {getDayName(d, true).toUpperCase()}
            </Text>
            <View
              style={[
                weekStyles.dayNum,
                isSelected && { backgroundColor: AppColors.light.primary },
              ]}
            >
              <Text
                style={[
                  weekStyles.dayNumText,
                  {
                    color: isSelected ? "#FFF" : isT ? AppColors.light.primary : colors.label,
                    fontFamily: isSelected || isT ? "Inter_700Bold" : "Inter_500Medium",
                  },
                ]}
              >
                {getDayNumber(d)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const weekStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  cell: { flex: 1, alignItems: "center", gap: 4 },
  dayName: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  dayNum: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dayNumText: { fontSize: 15 },
});

// ── Timeline task card ────────────────────────────────────────────────────────
function TimelineCard({
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
  const category = getCategory(task.colorValue);
  const cardBg = getCardBg(task.colorValue, isDark);
  const timeLabel = task.startTime ? formatTime(task.startTime, timeFormat) : "";
  const [timePart, ampm] = timeLabel.split(" ");

  const scale = useRef(new Animated.Value(1)).current;
  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    onToggle();
  };

  return (
    <View style={tlStyles.row}>
      {/* Time label */}
      <View style={tlStyles.timeCol}>
        <Text style={[tlStyles.timeMain, { color: colors.label }]}>{timePart}</Text>
        {ampm ? <Text style={[tlStyles.timeAmpm, { color: colors.tertiaryLabel }]}>{ampm}</Text> : null}
        <View style={[tlStyles.timeDot, { backgroundColor: AppColors.light.primaryLight }]} />
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[
          tlStyles.card,
          {
            backgroundColor: cardBg,
            opacity: task.isCompleted ? 0.6 : 1,
          },
        ]}
      >
        {/* Category badge */}
        <View style={tlStyles.cardTopRow}>
          <View style={[tlStyles.badge, { backgroundColor: task.colorValue + "40" }]}>
            <Feather name={category.icon as any} size={11} color={category.color} />
            <Text style={[tlStyles.badgeText, { color: category.color }]}>{category.label}</Text>
          </View>
          {task.isCompleted && (
            <View style={[tlStyles.badge, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check" size={11} color="#2E7D52" />
              <Text style={[tlStyles.badgeText, { color: "#2E7D52" }]}>DONE</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={[
            tlStyles.title,
            {
              color: colors.label,
              textDecorationLine: task.isCompleted ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Notes */}
        {task.notes ? (
          <Text style={[tlStyles.notes, { color: colors.tertiaryLabel }]} numberOfLines={2}>
            {task.notes}
          </Text>
        ) : null}

        {/* Footer row */}
        <View style={tlStyles.cardFooter}>
          <View style={[tlStyles.durationPill, { backgroundColor: colors.separator }]}>
            <Feather name="clock" size={10} color={colors.tertiaryLabel} />
            <Text style={[tlStyles.durationText, { color: colors.tertiaryLabel }]}>
              {formatDuration(task.durationMinutes)}
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              onPress={handleToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                tlStyles.checkBtn,
                {
                  backgroundColor: task.isCompleted ? AppColors.light.primary : "transparent",
                  borderColor: task.isCompleted ? AppColors.light.primary : colors.separatorStrong,
                },
              ]}
            >
              {task.isCompleted && <Feather name="check" size={12} color="#FFF" />}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingRight: 16, marginBottom: 16, alignItems: "flex-start" },

  timeCol: {
    width: 64,
    paddingLeft: 16,
    paddingTop: 14,
    alignItems: "flex-start",
    position: "relative",
  },
  timeMain: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  timeAmpm: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 1 },
  timeDot: {
    width: 8, height: 8, borderRadius: 4,
    position: "absolute", right: -4, top: 18,
  },

  card: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  title: { fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 24 },
  notes: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  durationPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  durationText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  checkBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 110 : insets.bottom + 90;

  const { selectedDate, setSelectedDate, getTasksForDate, toggleTaskCompletion, hapticsEnabled, timeFormat } =
    useTaskContext();

  const today = todayStr();
  const viewDate = selectedDate ?? today;

  const dayTasks = useMemo(
    () =>
      getTasksForDate(viewDate).sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime > b.startTime ? 1 : -1;
      }),
    [viewDate, getTasksForDate]
  );

  const monthYear = new Date(viewDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const taskCountLabel = `${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""} scheduled for ${isToday(viewDate) ? "today" : "this day"}`;

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
    router.push({ pathname: "/task-create", params: { date: viewDate } });
  }, [viewDate, hapticsEnabled]);

  const handleDaySelect = useCallback(
    (d: string) => {
      if (hapticsEnabled) Haptics.selectionAsync();
      setSelectedDate(d);
    },
    [hapticsEnabled, setSelectedDate]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Dark header */}
      <View style={[styles.darkHeader, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
          <Feather name="menu" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Mindful Canvas</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Feather name="user" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Month/Year + count */}
      <View style={[styles.monthSection, { backgroundColor: colors.scaffoldBackground }]}>
        <Text style={[styles.monthTitle, { color: colors.label }]}>{monthYear}</Text>
        <Text style={[styles.taskCount, { color: colors.tertiaryLabel }]}>{taskCountLabel}</Text>
      </View>

      {/* Week strip */}
      <WeekStrip selectedDate={viewDate} onSelect={handleDaySelect} isDark={isDark} />

      {/* Timeline */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {dayTasks.length > 0 ? (
          <>
            {/* Timeline line */}
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: colors.separator },
              ]}
            />
            {dayTasks.map((task) => (
              <TimelineCard
                key={task.id}
                task={task}
                timeFormat={timeFormat}
                onPress={() => handleTaskPress(task)}
                onToggle={() => handleToggle(task.id)}
                isDark={isDark}
              />
            ))}
          </>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.emptyIcon, { backgroundColor: AppColors.light.primaryBg }]}>
              <Feather name="sun" size={28} color={AppColors.light.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.label }]}>Clear day ahead</Text>
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              No tasks scheduled. Tap + to add one.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleAdd}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  darkHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#1C1B1F",
  },
  headerIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1, textAlign: "center",
    fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF",
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },

  monthSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  monthTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  taskCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  scroll: { flex: 1 },

  timelineLine: {
    position: "absolute",
    left: 59,
    top: 20,
    bottom: 0,
    width: 1,
  },

  emptyState: {
    margin: 16,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: {
    fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 20,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "web" ? 90 : 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
