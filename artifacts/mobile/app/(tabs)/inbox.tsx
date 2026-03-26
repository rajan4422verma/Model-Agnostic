import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  Alert,
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
import { formatDuration, todayStr } from "@/utils/dateUtils";

function InboxCard({
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.985, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Color strip */}
      <View style={[styles.cardStrip, { backgroundColor: task.colorValue }]} />

      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardBody}
      >
        {/* Icon circle */}
        <View style={[styles.cardIcon, { backgroundColor: task.colorValue + '22' }]}>
          <View style={[styles.cardIconDot, { backgroundColor: task.colorValue }]} />
        </View>

        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: colors.label }]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.notes ? (
            <Text style={[styles.cardNotes, { color: colors.tertiaryLabel }]} numberOfLines={1}>
              {task.notes}
            </Text>
          ) : null}
          <Text style={[styles.cardDuration, { color: task.colorValue }]}>
            {formatDuration(task.durationMinutes)}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onSchedule}
            style={[styles.scheduleBtn, { backgroundColor: AppColors.primary + '18' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="calendar" size={16} color={AppColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Feather name="x" size={18} color={colors.tertiaryLabel} />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
      const today = todayStr();
      const startTime = new Date(today + "T09:00:00").toISOString();
      scheduleFromInbox(id, startTime, today);
    },
    [scheduleFromInbox, hapticsEnabled]
  );

  const handleTaskPress = useCallback(
    (task: Task) => {
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: "/task-detail", params: { taskId: task.id, fromInbox: "true" } });
    },
    [hapticsEnabled]
  );

  const handleAdd = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/task-create", params: { inbox: "true" } });
  }, [hapticsEnabled]);

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSub, { color: colors.tertiaryLabel }]}>
              {inboxTasks.length} {inboxTasks.length === 1 ? "task" : "tasks"}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.label }]}>Inbox</Text>
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: AppColors.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {inboxTasks.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconCircle, { backgroundColor: AppColors.primary + '18' }]}>
              <Feather name="inbox" size={32} color={AppColors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.label }]}>Inbox is clear</Text>
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              Tasks you haven't scheduled yet will live here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {inboxTasks.map((task) => (
              <InboxCard
                key={task.id}
                task={task}
                isDark={isDark}
                onPress={() => handleTaskPress(task)}
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  list: { gap: 10 },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardNotes: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardDuration: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
