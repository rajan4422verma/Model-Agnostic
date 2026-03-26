import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
import { useTaskContext } from "@/context/TaskContext";
import { Task } from "@/context/TaskContext";
import { formatDuration, todayStr } from "@/utils/dateUtils";

interface InboxItemProps {
  task: Task;
  isDark: boolean;
  onPress: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  hapticsEnabled: boolean;
}

function InboxItem({ task, isDark, onPress, onDelete, onSchedule, hapticsEnabled }: InboxItemProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, tension: 200 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  };

  return (
    <Animated.View
      style={[
        styles.inboxItem,
        {
          backgroundColor: colors.cardBackground,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.inboxItemContent}
      >
        <View style={[styles.colorDot, { backgroundColor: task.colorValue }]} />
        <View style={styles.inboxItemText}>
          <Text style={[styles.inboxItemTitle, { color: colors.label }]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.notes ? (
            <Text style={[styles.inboxItemNotes, { color: colors.tertiaryLabel }]} numberOfLines={1}>
              {task.notes}
            </Text>
          ) : null}
          <Text style={[styles.inboxItemDuration, { color: colors.secondaryLabel }]}>
            {formatDuration(task.durationMinutes)}
          </Text>
        </View>
        <View style={styles.inboxItemActions}>
          <TouchableOpacity
            onPress={onSchedule}
            style={[styles.scheduleBtn, { backgroundColor: AppColors.primaryBlue + '1A' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="calendar" size={16} color={AppColors.primaryBlue} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={16} color={colors.tertiaryLabel} />
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
      Alert.alert("Delete Task", "Remove this task from your inbox?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
      // Schedule to today at 9am as default
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
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.label }]}>Inbox</Text>
        <Text style={[styles.headerSub, { color: colors.tertiaryLabel }]}>
          {inboxTasks.length} {inboxTasks.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {inboxTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={colors.tertiaryLabel} />
            <Text style={[styles.emptyTitle, { color: colors.label }]}>Inbox is empty</Text>
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>
              Add tasks here for when you're not sure when to do them.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {inboxTasks.map((task) => (
              <InboxItem
                key={task.id}
                task={task}
                isDark={isDark}
                onPress={() => handleTaskPress(task)}
                onDelete={() => handleDelete(task.id)}
                onSchedule={() => handleSchedule(task.id)}
                hapticsEnabled={hapticsEnabled}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: AppColors.primaryBlue,
            bottom: Platform.OS === "web" ? 100 : insets.bottom + 80,
          },
        ]}
        onPress={handleAdd}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  list: { gap: 10 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  inboxItem: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inboxItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  inboxItemText: { flex: 1, gap: 2 },
  inboxItemTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  inboxItemNotes: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  inboxItemDuration: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  inboxItemActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  scheduleBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
