import { Feather } from "@expo/vector-icons";
import { useIsDark } from "@/hooks/useIsDark";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { formatDuration, formatTimeRange, isToday, todayStr } from "@/utils/dateUtils";


const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function MonthCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  getTasksForDate,
  isDark,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  getTasksForDate: (d: string) => Task[];
  isDark: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = todayStr();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.cardBackground }]}>
      {/* Day names row */}
      <View style={styles.dayNames}>
        {DAY_NAMES.map((d) => (
          <Text key={d} style={[styles.dayName, { color: colors.tertiaryLabel }]}>{d}</Text>
        ))}
      </View>

      {/* Date grid */}
      <View style={styles.dateGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.dateCell} />;

          const dateStr = toDateStr(day);
          const isSelected = dateStr === selectedDate;
          const isT = dateStr === today;
          const hasTasks = getTasksForDate(dateStr).length > 0;

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              style={styles.dateCell}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dateCellInner,
                  isSelected && { backgroundColor: AppColors.light.primary },
                  isT && !isSelected && { backgroundColor: AppColors.light.primaryLight },
                ]}
              >
                <Text
                  style={[
                    styles.dateCellText,
                    { color: isSelected || isT ? "#FFF" : colors.label },
                  ]}
                >
                  {day}
                </Text>
              </View>
              {hasTasks && !isSelected && (
                <View style={[styles.calDot, { backgroundColor: AppColors.light.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sync hint */}
      <Text style={[styles.syncHint, { color: colors.tertiaryLabel }]}>
        Integration: Syncing with Google Calendar & Outlook
      </Text>
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [filter, setFilter] = useState<"all" | "reminders">("all");

  const { getTasksForDate, hapticsEnabled, timeFormat } = useTaskContext();

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectedTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);
  const upcomingTasks = selectedTasks.filter((t) => !t.isCompleted);
  const completedTasks = selectedTasks.filter((t) => t.isCompleted);

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: topPad + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
            <Feather name="chevron-left" size={20} color={colors.secondaryLabel} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.label }]}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
            <Feather name="chevron-right" size={20} color={colors.secondaryLabel} />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <MonthCalendar
          year={viewYear}
          month={viewMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          getTasksForDate={getTasksForDate}
          isDark={isDark}
        />

        {/* Connected Ecosystem card */}
        <View style={[styles.ecosystemCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.ecosystemTitle, { color: colors.label }]}>Connected Ecosystem</Text>
          <Text style={[styles.ecosystemSub, { color: colors.tertiaryLabel }]}>
            4 External apps synced to your mindful workspace.
          </Text>
          <View style={[styles.ecosystemRow, { borderBottomColor: colors.separator }]}>
            <View style={[styles.ecosystemIcon, { backgroundColor: "#0078D4" + "20" }]}>
              <Feather name="mail" size={16} color="#0078D4" />
            </View>
            <View style={styles.ecosystemInfo}>
              <Text style={[styles.ecosystemApp, { color: colors.label }]}>Outlook Reminders</Text>
              <Text style={[styles.ecosystemSync, { color: colors.tertiaryLabel }]}>Last sync: 2m ago</Text>
            </View>
          </View>
          <View style={styles.ecosystemRow}>
            <View style={[styles.ecosystemIcon, { backgroundColor: AppColors.light.primaryLight + "40" }]}>
              <Feather name="bell" size={16} color={AppColors.light.primary} />
            </View>
            <View style={styles.ecosystemInfo}>
              <Text style={[styles.ecosystemApp, { color: colors.label }]}>Apple Reminders</Text>
              <Text style={[styles.ecosystemSync, { color: colors.tertiaryLabel }]}>Up to date</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: AppColors.light.primary }]}>
            <Feather name="refresh-cw" size={14} color="#FFF" />
            <Text style={styles.syncBtnText}>Force Sync Now</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming tasks */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>Upcoming Tasks</Text>
          <View style={styles.filterPills}>
            {(["all", "reminders"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: filter === f ? AppColors.light.primary : colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: filter === f ? "#FFF" : colors.secondaryLabel },
                  ]}
                >
                  {f === "all" ? "All" : "Reminders"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {upcomingTasks.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            {upcomingTasks.map((task, idx) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push({ pathname: "/task-detail", params: { taskId: task.id } })}
                style={[
                  styles.taskRow,
                  idx < upcomingTasks.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                ]}
              >
                <View style={[styles.taskIcon, { backgroundColor: task.colorValue + "40" }]}>
                  <View style={[styles.taskIconDot, { backgroundColor: task.colorValue }]} />
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: colors.label }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  {task.notes ? (
                    <Text style={[styles.taskNotes, { color: colors.tertiaryLabel }]} numberOfLines={1}>
                      {task.notes}
                    </Text>
                  ) : null}
                  <View style={styles.taskMetaRow}>
                    <Feather name="calendar" size={11} color={colors.tertiaryLabel} />
                    <Text style={[styles.taskMetaText, { color: colors.tertiaryLabel }]}>
                      {isToday(selectedDate) ? "Today" : selectedDate}
                    </Text>
                    {task.startTime && (
                      <View style={[styles.badge, { backgroundColor: task.colorValue + "20" }]}>
                        <Text style={[styles.badgeText, { color: task.colorValue }]}>
                          {formatTimeRange(task.startTime, task.durationMinutes, "12h")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={colors.tertiaryLabel} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              No tasks for this day
            </Text>
          </View>
        )}

        {/* Completed */}
        {completedTasks.length > 0 && (
          <>
            <Text style={[styles.completedTitle, { color: colors.label }]}>Completed Today</Text>
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              {completedTasks.map((task, idx) => (
                <View
                  key={task.id}
                  style={[
                    styles.completedRow,
                    idx < completedTasks.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.separator,
                    },
                  ]}
                >
                  <Feather name="check-circle" size={18} color={AppColors.light.primary} />
                  <Text style={[styles.completedTitle2, { color: colors.tertiaryLabel }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={[styles.completedDur, { color: colors.tertiaryLabel }]}>
                    {formatDuration(task.durationMinutes)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 12,
  },
  monthNavBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },

  calendarCard: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dayNames: { flexDirection: "row", marginBottom: 8 },
  dayName: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  dateGrid: { flexDirection: "row", flexWrap: "wrap" },
  dateCell: { width: "14.28%", alignItems: "center", paddingVertical: 3, gap: 2 },
  dateCellInner: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dateCellText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  syncHint: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 },

  ecosystemCard: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  ecosystemTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ecosystemSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -6 },
  ecosystemRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ecosystemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ecosystemInfo: { flex: 1 },
  ecosystemApp: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  ecosystemSync: { fontSize: 12, fontFamily: "Inter_400Regular" },
  syncBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 22, paddingVertical: 12,
  },
  syncBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  filterPills: { flexDirection: "row", gap: 6 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  filterPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  card: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  taskIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  taskIconDot: { width: 14, height: 14, borderRadius: 7 },
  taskContent: { flex: 1, gap: 3 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskNotes: { fontSize: 13, fontFamily: "Inter_400Regular" },
  taskMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  taskMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  emptyCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },

  completedTitle: { fontSize: 17, fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 10 },
  completedRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  completedTitle2: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  completedDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
