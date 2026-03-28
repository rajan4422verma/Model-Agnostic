import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useIsDark } from "@/hooks/useIsDark";
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

// ── Task icon mapping (keyword-based, extensible) ─────────────────────────────
function getTaskIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("meditat") || t.includes("mindful") || t.includes("lotus") || t.includes("zen") || t.includes("breathe")) return "wind";
  if (t.includes("run") || t.includes("jog") || t.includes("sprint") || t.includes("marathon")) return "activity";
  if (t.includes("breakfast") || t.includes("coffee") || t.includes("tea") || t.includes("brunch")) return "coffee";
  if (t.includes("lunch") || t.includes("dinner") || t.includes("meal") || t.includes("eat") || t.includes("food")) return "sunset";
  if (t.includes("deep work") || t.includes("laptop") || t.includes("computer") || t.includes("coding")) return "monitor";
  if (t.includes("code") || t.includes("program") || t.includes("engineer") || t.includes("develop")) return "code";
  if (t.includes("study") || t.includes("book") || t.includes("read") || t.includes("learn")) return "book";
  if (t.includes("meeting") || t.includes("standup") || t.includes("call") || t.includes("team") || t.includes("interview")) return "users";
  if (t.includes("exercise") || t.includes("gym") || t.includes("workout") || t.includes("lift")) return "zap";
  if (t.includes("walk") || t.includes("stroll") || t.includes("hike")) return "navigation";
  if (t.includes("email") || t.includes("admin") || t.includes("mail") || t.includes("inbox")) return "mail";
  if (t.includes("plan") || t.includes("review") || t.includes("schedule") || t.includes("organize")) return "clipboard";
  if (t.includes("health") || t.includes("wellness") || t.includes("yoga") || t.includes("stretch")) return "heart";
  if (t.includes("routine") || t.includes("daily") || t.includes("habit")) return "calendar";
  if (t.includes("work") || t.includes("project") || t.includes("task")) return "briefcase";
  if (t.includes("shower") || t.includes("grooming") || t.includes("prep")) return "droplet";
  if (t.includes("sleep") || t.includes("nap") || t.includes("rest")) return "moon";
  return "check-square";
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

  const endTimeLabel = task.startTime
    ? formatTime(
        new Date(new Date(task.startTime).getTime() + task.durationMinutes * 60000).toISOString(),
        timeFormat
      )
    : "";
  const timeRangeLabel = timeLabel && endTimeLabel ? `${timeLabel} – ${endTimeLabel}` : "";

  // Validate iconName is a known Feather icon; fall back to keyword detection otherwise
  const VALID_FEATHER_ICONS = new Set([
    "wind","activity","coffee","monitor","book","users","zap","heart","code","mail",
    "calendar","sun","moon","droplet","clipboard","navigation","check-square","briefcase",
    "music","camera","shopping-cart","home","edit","file-text","pen-tool","compass",
    "plus-circle","sunset","settings","star","flag","bell","map","battery","wifi",
    "trending-up","award","target","inbox","layers","package","tool","user","check",
  ]);
  const taskIcon = (task.iconName && VALID_FEATHER_ICONS.has(task.iconName))
    ? task.iconName
    : getTaskIcon(task.title);

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
      {/* Time label — vertically centered in the row */}
      <View style={tlStyles.timeCol}>
        <View style={tlStyles.timeTextWrap}>
          <Text style={[tlStyles.timeMain, { color: colors.label }]}>{timePart}</Text>
          {ampm ? <Text style={[tlStyles.timeAmpm, { color: colors.tertiaryLabel }]}>{ampm}</Text> : null}
        </View>
        <View style={[tlStyles.timeDot, { backgroundColor: AppColors.light.primaryLight }]} />
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[tlStyles.card, { backgroundColor: cardBg, opacity: task.isCompleted ? 0.75 : 1 }]}
      >
        {/* Time range badge row */}
        <View style={tlStyles.cardTopRow}>
          {timeRangeLabel ? (
            <View style={[tlStyles.badge, { backgroundColor: task.colorValue + "40" }]}>
              <Feather name="clock" size={11} color={category.color} />
              <Text style={[tlStyles.badgeText, { color: category.color }]}>{timeRangeLabel}</Text>
            </View>
          ) : null}
          {task.isCompleted && (
            <View style={[tlStyles.badge, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check" size={11} color="#2E7D52" />
              <Text style={[tlStyles.badgeText, { color: "#2E7D52" }]}>DONE</Text>
            </View>
          )}
        </View>

        {/* Icon in colorful circle + title */}
        <View style={tlStyles.titleRow}>
          <View style={[tlStyles.iconCircle, { backgroundColor: task.colorValue + "50" }]}>
            <Feather name={taskIcon as any} size={22} color={category.color} />
          </View>
          <Text
            style={[
              tlStyles.title,
              {
                color: colors.label,
                textDecorationLine: task.isCompleted ? "line-through" : "none",
                flex: 1,
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
        </View>

        {/* Notes */}
        {task.notes ? (
          <Text style={[tlStyles.notes, { color: colors.tertiaryLabel }]} numberOfLines={2}>
            {task.notes}
          </Text>
        ) : null}

        {/* Footer — duration only (checkbox moved outside) */}
        <View style={tlStyles.cardFooter}>
          <View style={[tlStyles.durationPill, { backgroundColor: colors.separator }]}>
            <Feather name="clock" size={10} color={colors.tertiaryLabel} />
            <Text style={[tlStyles.durationText, { color: colors.tertiaryLabel }]}>
              {formatDuration(task.durationMinutes)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Checkbox — outside card, vertically centered */}
      <Animated.View style={[tlStyles.checkWrap, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={handleToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            tlStyles.checkBtn,
            {
              backgroundColor: task.isCompleted ? AppColors.light.primary : "transparent",
              borderColor: task.isCompleted ? AppColors.light.primary : colors.separatorStrong,
            },
          ]}
        >
          {task.isCompleted && <Feather name="check" size={14} color="#FFF" />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingRight: 8, marginBottom: 16, alignItems: "center" },

  timeCol: {
    width: 64,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  timeTextWrap: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  timeMain: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  timeAmpm: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 1 },
  timeDot: {
    width: 9, height: 9, borderRadius: 5,
    marginRight: -4.5,
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

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 23 },
  notes: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  cardFooter: { flexDirection: "row", alignItems: "center" },
  durationPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  durationText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  checkWrap: { paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  checkBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
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
      {/* Month/Year + count + calendar icon */}
      <View style={[styles.monthSection, { backgroundColor: colors.scaffoldBackground, paddingTop: topPad + 8 }]}>
        <View style={styles.monthRow}>
          <View style={styles.monthTextCol}>
            <Text style={[styles.monthTitle, { color: colors.label }]}>{monthYear}</Text>
            <Text style={[styles.taskCount, { color: colors.tertiaryLabel }]}>{taskCountLabel}</Text>
          </View>
          <TouchableOpacity
            style={[styles.calIconBtn, { backgroundColor: colors.cardBackground }]}
            onPress={() => router.push("/(tabs)/calendar")}
            activeOpacity={0.8}
          >
            <Feather name="calendar" size={20} color={AppColors.light.primary} />
          </TouchableOpacity>
        </View>
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

  monthSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTextCol: { flex: 1 },
  calIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
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
    left: 60,
    top: 30,
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
