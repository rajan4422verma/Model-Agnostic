import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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
import { RecurrenceType, useTaskContext } from "@/context/TaskContext";
import { getTimeFromHour, todayStr } from "@/utils/dateUtils";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: "None", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekly", value: "weekly" },
];

const ICON_OPTIONS = [
  "work",
  "fitness-center",
  "restaurant",
  "menu-book",
  "laptop-mac",
  "self-improvement",
  "directions-run",
  "coffee",
  "groups",
  "edit-note",
  "local-hospital",
  "shopping-cart",
  "code",
  "explore",
  "description",
  "music-note",
  "phone",
  "home",
  "star",
  "favorite",
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export default function TaskCreateScreen() {
  const { date, inbox } = useLocalSearchParams<{ date?: string; inbox?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isInbox = inbox === "true";

  const { addTask, addToInbox, hapticsEnabled } = useTaskContext();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedColor, setSelectedColor] = useState(AppColors.primaryBlue);
  const [duration, setDuration] = useState(30);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);

  const handleSave = async () => {
    if (!title.trim()) {
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const targetDate = date || todayStr();
    const startTime = isInbox
      ? undefined
      : new Date(`${targetDate}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`).toISOString();

    const taskData = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      startTime,
      durationMinutes: duration,
      colorValue: selectedColor,
      iconName: "work",
      isCompleted: false,
      subtasks: [],
      recurrence,
      recurrenceDays: [],
      notificationMinutesBefore: -1,
      date: targetDate,
    };

    if (isInbox) {
      await addToInbox(taskData);
    } else {
      await addTask(taskData);
    }

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Handle */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.separator }]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.tertiaryLabel }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.label }]}>
          {isInbox ? "Add to Inbox" : "New Task"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: title.trim() ? AppColors.primaryBlue : colors.separator }]}
          disabled={!title.trim()}
        >
          <Text style={[styles.saveBtnText, { color: title.trim() ? "#FFF" : colors.tertiaryLabel }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Notes */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.label }]}
            placeholder="Task title"
            placeholderTextColor={colors.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
            maxLength={80}
          />
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <TextInput
            style={[styles.notesInput, { color: colors.secondaryLabel }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.tertiaryLabel}
            value={notes}
            onChangeText={setNotes}
            multiline
            returnKeyType="done"
          />
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>DURATION</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => {
                  setDuration(d);
                  if (hapticsEnabled) Haptics.selectionAsync();
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: duration === d ? AppColors.primaryBlue : colors.cardBackground,
                    borderColor: duration === d ? AppColors.primaryBlue : colors.separator,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: duration === d ? "#FFF" : colors.label },
                  ]}
                >
                  {d < 60 ? `${d}m` : `${d / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Start time (only for scheduled) */}
        {!isInbox && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>START TIME</Text>
            <View style={styles.timeRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {HOUR_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => {
                      setStartHour(h);
                      if (hapticsEnabled) Haptics.selectionAsync();
                    }}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: startHour === h ? AppColors.primaryBlue : colors.cardBackground,
                        borderColor: startHour === h ? AppColors.primaryBlue : colors.separator,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: startHour === h ? "#FFF" : colors.label },
                      ]}
                    >
                      {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {MINUTE_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setStartMinute(m);
                    if (hapticsEnabled) Haptics.selectionAsync();
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: startMinute === m ? AppColors.primaryBlue : colors.cardBackground,
                      borderColor: startMinute === m ? AppColors.primaryBlue : colors.separator,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: startMinute === m ? "#FFF" : colors.label },
                    ]}
                  >
                    :{String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>COLOR</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {AppColors.taskColors.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  setSelectedColor(c);
                  if (hapticsEnabled) Haptics.selectionAsync();
                }}
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: c,
                    borderWidth: selectedColor === c ? 3 : 0,
                    borderColor: selectedColor === c ? "#FFF" : "transparent",
                    shadowColor: selectedColor === c ? c : "transparent",
                    shadowOpacity: selectedColor === c ? 0.6 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: selectedColor === c ? 4 : 0,
                  },
                ]}
              >
                {selectedColor === c && (
                  <Feather name="check" size={14} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>REPEAT</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setRecurrence(opt.value);
                  if (hapticsEnabled) Haptics.selectionAsync();
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: recurrence === opt.value ? AppColors.primaryBlue : colors.cardBackground,
                    borderColor: recurrence === opt.value ? AppColors.primaryBlue : colors.separator,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: recurrence === opt.value ? "#FFF" : colors.label },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>PREVIEW</Text>
          <View
            style={[
              styles.preview,
              {
                backgroundColor: selectedColor + "CC",
                borderLeftColor: selectedColor,
              },
            ]}
          >
            <Text style={styles.previewTitle} numberOfLines={1}>
              {title || "Task title"}
            </Text>
            {!isInbox && (
              <Text style={styles.previewTime}>
                {startHour === 0 ? "12" : startHour <= 12 ? startHour : startHour - 12}:
                {String(startMinute).padStart(2, "0")} {startHour < 12 ? "AM" : "PM"} •{" "}
                {duration < 60 ? `${duration}m` : `${duration / 60}h`}
              </Text>
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
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 20,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  titleInput: {
    padding: 16,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    minHeight: 56,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  notesInput: {
    padding: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  timeRow: { gap: 8 },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 12,
    paddingLeft: 14,
    gap: 4,
  },
  previewTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFF",
  },
  previewTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
});
