import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  addDays,
  formatTime,
  formatTimeRange,
  getDayName,
  getDayNumber,
  getWeekDays,
  isToday,
  todayStr,
} from "@/utils/dateUtils";

const HOUR_HEIGHT = 64;
const TIMELINE_START = 6;
const TIMELINE_HOURS = 19;
const TIME_COL_WIDTH = 48;

function getCurrentTimeOffset(): number {
  const now = new Date();
  return (now.getHours() - TIMELINE_START + now.getMinutes() / 60) * HOUR_HEIGHT;
}

function getTaskTop(isoString: string): number {
  const d = new Date(isoString);
  return (d.getHours() - TIMELINE_START + d.getMinutes() / 60) * HOUR_HEIGHT;
}

function getTaskHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 36);
}

// --- Completion Ring ---
function CompletionRing({ completed, color, onPress }: { completed: boolean; color: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 300 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View
        style={[
          styles.completionRing,
          {
            borderColor: completed ? color : '#D8D0CE',
            backgroundColor: completed ? color : 'transparent',
            transform: [{ scale }],
          },
        ]}
      >
        {completed && <Feather name="check" size={12} color="#FFF" />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// --- Task Row (list-style like Structured app) ---
interface TaskRowProps {
  task: Task;
  timeFormat: '12h' | '24h';
  onPress: () => void;
  onToggleComplete: () => void;
  isDark: boolean;
}

function TaskRow({ task, timeFormat, onPress, onToggleComplete, isDark }: TaskRowProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const top = task.startTime ? getTaskTop(task.startTime) : 0;
  const height = getTaskHeight(task.durationMinutes);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.985, useNativeDriver: true, tension: 200 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  };

  const showTime = height >= 52;
  const completedSubs = task.subtasks.filter(s => s.isCompleted).length;
  const hasSubs = task.subtasks.length > 0;

  return (
    <Animated.View
      style={[
        styles.taskRow,
        {
          top,
          height,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Left: colored strip */}
      <View style={[styles.taskStrip, { backgroundColor: task.colorValue }]} />

      {/* Icon circle */}
      <View style={[styles.taskIconCircle, { backgroundColor: task.colorValue + '22' }]}>
        <View style={[styles.taskIconDot, { backgroundColor: task.colorValue }]} />
      </View>

      {/* Content */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.taskContent}
      >
        <Text
          style={[
            styles.taskTitle,
            {
              color: task.isCompleted ? colors.tertiaryLabel : colors.label,
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={height > 52 ? 2 : 1}
        >
          {task.title}
        </Text>
        {showTime && task.startTime && (
          <Text style={[styles.taskTime, { color: colors.tertiaryLabel }]}>
            {formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
          </Text>
        )}
        {hasSubs && height > 56 && (
          <Text style={[styles.taskSubCount, { color: task.colorValue }]}>
            {completedSubs}/{task.subtasks.length}
          </Text>
        )}
      </Pressable>

      {/* Right: completion ring */}
      <View style={styles.taskRingWrap}>
        <CompletionRing
          completed={task.isCompleted}
          color={task.colorValue}
          onPress={onToggleComplete}
        />
      </View>
    </Animated.View>
  );
}

// --- Week Strip ---
interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isDark: boolean;
  getTasksForDate: (date: string) => Task[];
}

function WeekStrip({ selectedDate, onSelectDate, isDark, getTasksForDate }: WeekStripProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const weekDays = getWeekDays(selectedDate, 1);

  return (
    <View style={[styles.weekStrip, { borderBottomColor: colors.separator }]}>
      {weekDays.map((day) => {
        const isSelected = day === selectedDate;
        const isT = isToday(day);
        const dayTasks = getTasksForDate(day);

        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelectDate(day)}
            style={styles.weekDay}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.weekDayLabel,
                { color: isSelected ? AppColors.primary : colors.tertiaryLabel },
              ]}
            >
              {getDayName(day, true).slice(0, 1).toUpperCase()}
            </Text>
            <View
              style={[
                styles.weekDayCircle,
                isSelected && { backgroundColor: AppColors.primary },
                isT && !isSelected && { borderWidth: 1.5, borderColor: AppColors.primary },
              ]}
            >
              <Text
                style={[
                  styles.weekDayNum,
                  { color: isSelected ? '#FFF' : isT ? AppColors.primary : colors.label },
                ]}
              >
                {getDayNumber(day)}
              </Text>
            </View>
            {/* Colored task dots */}
            <View style={styles.taskDots}>
              {dayTasks.slice(0, 3).map((t, i) => (
                <View
                  key={t.id + i}
                  style={[styles.taskDot, { backgroundColor: t.colorValue }]}
                />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Hour Label + Line ---
function HourRow({ hour, isDark }: { hour: number; isDark: boolean }) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const amPm = hour < 12 ? 'AM' : 'PM';
  const label = `${h} ${amPm}`;

  return (
    <View style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
      <Text style={[styles.hourLabel, { color: colors.tertiaryLabel }]}>{label}</Text>
      <View style={[styles.hourLine, { borderTopColor: colors.separator }]} />
    </View>
  );
}

// --- Main Screen ---
export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? AppColors.dark : AppColors.light;

  const { selectedDate, setSelectedDate, getTasksForDate, toggleTaskCompletion, hapticsEnabled, timeFormat } = useTaskContext();
  const scrollRef = useRef<ScrollView>(null);
  const [currentOffset, setCurrentOffset] = useState(getCurrentTimeOffset);

  const dayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);
  const scheduledTasks = useMemo(
    () => dayTasks.filter(t => t.startTime).sort((a, b) => (a.startTime! > b.startTime! ? 1 : -1)),
    [dayTasks]
  );
  const completedCount = dayTasks.filter(t => t.isCompleted).length;
  const showCurrentTime = isToday(selectedDate);
  const totalHeight = TIMELINE_HOURS * HOUR_HEIGHT;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const interval = setInterval(() => setCurrentOffset(getCurrentTimeOffset()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const target = showCurrentTime ? currentOffset - 120 : (8 - TIMELINE_START) * HOUR_HEIGHT;
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [selectedDate]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/task-detail', params: { taskId: task.id } });
    },
    [hapticsEnabled]
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toggleTaskCompletion(id);
    },
    [hapticsEnabled, toggleTaskCompletion]
  );

  const handleAdd = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/task-create', params: { date: selectedDate } });
  }, [selectedDate, hapticsEnabled]);

  // Formatted header date
  const headerDate = (() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return { dayNum, monthName, year, dayName: getDayName(selectedDate, false) };
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.scaffoldBackground,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerMonthYear, { color: colors.tertiaryLabel }]}>
              {headerDate.monthName} {headerDate.year}
            </Text>
            <View style={styles.headerDateRow}>
              <Text style={[styles.headerDay, { color: colors.label }]}>
                {isToday(selectedDate) ? 'Today' : headerDate.dayName}
              </Text>
              {dayTasks.length > 0 && (
                <View style={[styles.taskCountBadge, { backgroundColor: AppColors.primary }]}>
                  <Text style={styles.taskCountText}>
                    {completedCount}/{dayTasks.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={handleAdd} style={styles.addBtn} activeOpacity={0.85}>
            <Feather name="plus" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          isDark={isDark}
          getTasksForDate={getTasksForDate}
        />
      </View>

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 100, height: totalHeight + (Platform.OS === 'web' ? 120 : 100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: totalHeight, position: 'relative' }}>
          {/* Hour rows */}
          {Array.from({ length: TIMELINE_HOURS }, (_, i) => (
            <HourRow key={i} hour={TIMELINE_START + i} isDark={isDark} />
          ))}

          {/* Current time line */}
          {showCurrentTime && (
            <View style={[styles.nowLine, { top: currentOffset, backgroundColor: AppColors.primary }]}>
              <View style={[styles.nowDot, { backgroundColor: AppColors.primary }]} />
            </View>
          )}

          {/* Tasks overlay */}
          <View style={styles.tasksOverlay}>
            {scheduledTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                timeFormat={timeFormat}
                onPress={() => handleTaskPress(task)}
                onToggleComplete={() => handleToggle(task.id)}
                isDark={isDark}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingBottom: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerMonthYear: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDay: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  taskCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  weekDayLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  weekDayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNum: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  taskDots: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    alignItems: 'center',
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  scroll: { flex: 1 },

  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  hourLabel: {
    width: TIME_COL_WIDTH,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  hourLine: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },

  nowLine: {
    position: 'absolute',
    left: TIME_COL_WIDTH,
    right: 0,
    height: 1.5,
    zIndex: 30,
  },
  nowDot: {
    position: 'absolute',
    left: -5,
    top: -4.5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  tasksOverlay: {
    position: 'absolute',
    left: TIME_COL_WIDTH + 4,
    right: 8,
    top: 0,
    bottom: 0,
  },
  taskRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  taskStrip: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  taskIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    flexShrink: 0,
  },
  taskIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskContent: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 4,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  taskTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  taskSubCount: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  taskRingWrap: {
    paddingRight: 10,
    paddingLeft: 6,
    justifyContent: 'center',
  },
  completionRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
