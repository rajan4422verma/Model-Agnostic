import { Feather, MaterialIcons } from "@expo/vector-icons";
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
import { useTaskContext } from "@/context/TaskContext";
import { Task } from "@/context/TaskContext";
import {
  addDays,
  formatDuration,
  formatTime,
  formatTimeRange,
  getDayName,
  getDayNumber,
  getWeekDays,
  isToday,
  todayStr,
} from "@/utils/dateUtils";

const HOUR_HEIGHT = 72;
const TIMELINE_START = 6; // 6am
const TIMELINE_HOURS = 19; // 6am - midnight (25 hours shown)
const LEFT_GUTTER = 52;

function getCurrentTimeOffset(): number {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return (hour - TIMELINE_START + minute / 60) * HOUR_HEIGHT;
}

function getTaskOffset(isoString: string): number {
  const d = new Date(isoString);
  const hour = d.getHours();
  const minute = d.getMinutes();
  return (hour - TIMELINE_START + minute / 60) * HOUR_HEIGHT;
}

function getTaskHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * HOUR_HEIGHT, 28);
}

// --- Task Block Component ---
interface TaskBlockProps {
  task: Task;
  timeFormat: '12h' | '24h';
  onPress: () => void;
  isDark: boolean;
}

function TaskBlock({ task, timeFormat, onPress, isDark }: TaskBlockProps) {
  const top = task.startTime ? getTaskOffset(task.startTime) : 0;
  const height = getTaskHeight(task.durationMinutes);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 120 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120 }).start();
  };

  const showSubtasks = height > 60 && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <Animated.View
      style={[
        styles.taskBlock,
        {
          top,
          height,
          backgroundColor: task.colorValue + (task.isCompleted ? '33' : 'CC'),
          borderLeftColor: task.colorValue,
          transform: [{ scale: scaleAnim }],
          opacity: task.isCompleted ? 0.6 : 1,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.taskBlockInner}
      >
        <Text
          style={[
            styles.taskBlockTitle,
            {
              color: '#FFFFFF',
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={height > 48 ? 2 : 1}
        >
          {task.title}
        </Text>
        {height > 44 && task.startTime && (
          <Text style={[styles.taskBlockTime, { color: 'rgba(255,255,255,0.8)' }]}>
            {formatTimeRange(task.startTime, task.durationMinutes, timeFormat)}
          </Text>
        )}
        {showSubtasks && (
          <Text style={styles.taskBlockSubtasks}>
            {completedSubtasks}/{task.subtasks.length}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// --- Week Day Picker ---
interface WeekPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isDark: boolean;
  getTasksForDate: (date: string) => Task[];
}

function WeekPicker({ selectedDate, onSelectDate, isDark, getTasksForDate }: WeekPickerProps) {
  const weekDays = getWeekDays(selectedDate, 1);
  const colors = isDark ? AppColors.dark : AppColors.light;

  return (
    <View style={[styles.weekPicker, { borderBottomColor: colors.separator }]}>
      {weekDays.map((day) => {
        const isSelected = day === selectedDate;
        const isT = isToday(day);
        const dayTasks = getTasksForDate(day);
        const hasCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.isCompleted);
        const hasTasks = dayTasks.length > 0;

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
                { color: isT ? AppColors.primaryBlue : colors.tertiaryLabel },
              ]}
            >
              {getDayName(day).toUpperCase()}
            </Text>
            <View
              style={[
                styles.weekDayNumber,
                isSelected && { backgroundColor: AppColors.primaryBlue },
                isT && !isSelected && { borderWidth: 1.5, borderColor: AppColors.primaryBlue },
              ]}
            >
              <Text
                style={[
                  styles.weekDayNumberText,
                  { color: isSelected ? '#FFF' : isT ? AppColors.primaryBlue : colors.label },
                ]}
              >
                {getDayNumber(day)}
              </Text>
            </View>
            <View style={styles.weekDayDots}>
              {hasTasks && (
                <View
                  style={[
                    styles.weekDayDot,
                    { backgroundColor: hasCompleted ? colors.tertiaryLabel : AppColors.primaryBlue },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Hour Row ---
interface HourRowProps {
  hour: number;
  isDark: boolean;
}

function HourRow({ hour, isDark }: HourRowProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

  return (
    <View style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
      <Text style={[styles.hourLabel, { color: colors.tertiaryLabel }]}>{label}</Text>
      <View style={[styles.hourLine, { borderTopColor: colors.separator }]} />
    </View>
  );
}

// --- Main Screen ---
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? AppColors.dark : AppColors.light;

  const { selectedDate, setSelectedDate, getTasksForDate, hapticsEnabled, timeFormat } = useTaskContext();
  const scrollRef = useRef<ScrollView>(null);
  const [currentTimeOffset, setCurrentTimeOffset] = useState(getCurrentTimeOffset);
  const [showTimeLine, setShowTimeLine] = useState(false);

  const dayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);

  // Current time indicator
  useEffect(() => {
    const update = () => {
      setCurrentTimeOffset(getCurrentTimeOffset());
      setShowTimeLine(isToday(selectedDate));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Scroll to current time or 8am on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      const target = isToday(selectedDate) ? currentTimeOffset - 100 : (8 - TIMELINE_START) * HOUR_HEIGHT;
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
    }, 300);
    return () => clearTimeout(timeout);
  }, [selectedDate]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/task-detail', params: { taskId: task.id } });
    },
    [hapticsEnabled]
  );

  const handleAddTask = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/task-create', params: { date: selectedDate } });
  }, [selectedDate, hapticsEnabled]);

  const handlePrevWeek = () => {
    const newDate = addDays(selectedDate, -7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addDays(selectedDate, 7);
    setSelectedDate(newDate);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const totalHeight = TIMELINE_HOURS * HOUR_HEIGHT;

  const scheduledTasks = dayTasks.filter((t) => t.startTime);
  const completedCount = dayTasks.filter((t) => t.isCompleted).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handlePrevWeek} style={styles.navBtn}>
            <Feather name="chevron-left" size={22} color={colors.secondaryLabel} />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={[styles.headerDate, { color: colors.label }]}>
              {isToday(selectedDate) ? 'Today' : getDayName(selectedDate, false)}
            </Text>
            {dayTasks.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.tertiaryLabel }]}>
                {completedCount}/{dayTasks.length} done
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleNextWeek} style={styles.navBtn}>
            <Feather name="chevron-right" size={22} color={colors.secondaryLabel} />
          </TouchableOpacity>
        </View>

        <WeekPicker
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          isDark={isDark}
          getTasksForDate={getTasksForDate}
        />
      </View>

      {/* Timeline Scroll */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.timelineContainer, { height: totalHeight }]}>
          {/* Hour rows */}
          {Array.from({ length: TIMELINE_HOURS }, (_, i) => (
            <HourRow key={i} hour={TIMELINE_START + i} isDark={isDark} />
          ))}

          {/* Current time line */}
          {showTimeLine && (
            <View
              style={[
                styles.currentTimeLine,
                {
                  top: currentTimeOffset,
                  backgroundColor: colors.currentTimeRed,
                },
              ]}
            >
              <View style={[styles.currentTimeDot, { backgroundColor: colors.currentTimeRed }]} />
            </View>
          )}

          {/* Task blocks */}
          <View style={styles.tasksColumn}>
            {scheduledTasks.map((task) => (
              <TaskBlock
                key={task.id}
                task={task}
                timeFormat={timeFormat}
                onPress={() => handleTaskPress(task)}
                isDark={isDark}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: AppColors.primaryBlue,
            bottom: Platform.OS === 'web' ? 100 : insets.bottom + 80,
          },
        ]}
        onPress={handleAddTask}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  weekPicker: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekDayLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  weekDayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNumberText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  weekDayDots: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  timelineContainer: {
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  hourLabel: {
    width: LEFT_GUTTER,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  hourLine: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  currentTimeLine: {
    position: 'absolute',
    left: LEFT_GUTTER,
    right: 0,
    height: 1.5,
    zIndex: 20,
  },
  currentTimeDot: {
    position: 'absolute',
    left: -5,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tasksColumn: {
    position: 'absolute',
    left: LEFT_GUTTER + 4,
    right: 12,
    top: 0,
    bottom: 0,
  },
  taskBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  taskBlockInner: {
    flex: 1,
    padding: 8,
    paddingLeft: 10,
  },
  taskBlockTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  taskBlockTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  taskBlockSubtasks: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
