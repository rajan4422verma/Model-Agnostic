import { Feather } from "@expo/vector-icons";
import { useIsDark } from "@/hooks/useIsDark";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/constants/colors";
import { RecurrenceType, useTaskContext } from "@/context/TaskContext";
import { todayStr } from "@/utils/dateUtils";

const ICON_OPTIONS: { name: string; label: string }[] = [
  { name: "wind", label: "Meditate" },
  { name: "activity", label: "Run" },
  { name: "coffee", label: "Coffee" },
  { name: "monitor", label: "Work" },
  { name: "book", label: "Study" },
  { name: "users", label: "Meeting" },
  { name: "zap", label: "Workout" },
  { name: "heart", label: "Health" },
  { name: "code", label: "Code" },
  { name: "mail", label: "Email" },
  { name: "calendar", label: "Schedule" },
  { name: "sun", label: "Morning" },
  { name: "moon", label: "Sleep" },
  { name: "droplet", label: "Hydrate" },
  { name: "clipboard", label: "Plan" },
  { name: "navigation", label: "Commute" },
  { name: "check-square", label: "Task" },
  { name: "briefcase", label: "Project" },
  { name: "music", label: "Music" },
  { name: "camera", label: "Photo" },
  { name: "shopping-cart", label: "Shop" },
  { name: "home", label: "Home" },
];

const DURATION_OPTIONS = [
  { label: "1", value: 1 },
  { label: "15", value: 15 },
  { label: "30m", value: 30 },
  { label: "45", value: 45 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
];

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: "None", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekdays", value: "weekdays" },
  { label: "Weekly", value: "weekly" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_SLOTS = [0, 15, 30, 45];

function TimePickerDrum({
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
  isDark,
  accentColor,
}: {
  selectedHour: number;
  selectedMinute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  isDark: boolean;
  accentColor: string;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  const ITEM_HEIGHT = 44;
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const formatHour = (h: number) => {
    const hLabel = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const amPm = h < 12 ? "AM" : "PM";
    return `${hLabel}:00 ${amPm}`;
  };

  const formatMinute = (h: number, m: number) => {
    const hLabel = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const amPm = h < 12 ? "AM" : "PM";
    return `${hLabel}:${String(m).padStart(2, "0")} ${amPm}`;
  };

  return (
    <View style={[styles.drumWrap, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.drumLabel, { color: colors.tertiaryLabel }]}>
        Time
      </Text>
      <View style={styles.drum}>
        {/* Hour Column */}
        <ScrollView
          ref={hourScrollRef}
          style={{ flex: 1, height: ITEM_HEIGHT * 5 }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: selectedHour * ITEM_HEIGHT }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            onHourChange(Math.max(0, Math.min(23, idx)));
            Haptics.selectionAsync();
          }}
        >
          {HOURS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[
                styles.drumItem,
                { height: ITEM_HEIGHT },
                selectedHour === h && {
                  backgroundColor: accentColor,
                  borderRadius: 24,
                },
              ]}
              onPress={() => {
                onHourChange(h);
                hourScrollRef.current?.scrollTo({
                  y: h * ITEM_HEIGHT,
                  animated: true,
                });
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.drumItemText,
                  {
                    color: selectedHour === h ? "#FFF" : colors.label,
                    fontFamily:
                      selectedHour === h
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                  },
                ]}
              >
                {formatHour(h)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Minute Column */}
        <ScrollView
          ref={minuteScrollRef}
          style={{ flex: 1, height: ITEM_HEIGHT * 5 }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentOffset={{
            x: 0,
            y: MINUTE_SLOTS.indexOf(selectedMinute) * ITEM_HEIGHT,
          }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            onMinuteChange(MINUTE_SLOTS[Math.max(0, Math.min(3, idx))]);
            Haptics.selectionAsync();
          }}
        >
          {MINUTE_SLOTS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.drumItem,
                { height: ITEM_HEIGHT },
                selectedMinute === m && {
                  backgroundColor: accentColor,
                  borderRadius: 24,
                },
              ]}
              onPress={() => {
                onMinuteChange(m);
                minuteScrollRef.current?.scrollTo({
                  y: MINUTE_SLOTS.indexOf(m) * ITEM_HEIGHT,
                  animated: true,
                });
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.drumItemText,
                  {
                    color: selectedMinute === m ? "#FFF" : colors.label,
                    fontFamily:
                      selectedMinute === m
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                  },
                ]}
              >
                {formatMinute(selectedHour, m)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function StepDot({ active, isDark }: { active: boolean; isDark: boolean }) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  return (
    <View
      style={[
        styles.stepDot,
        { backgroundColor: active ? AppColors.primary : colors.separator },
        active && { width: 20 },
      ]}
    />
  );
}

export default function TaskCreateScreen() {
  const { date, inbox } = useLocalSearchParams<{
    date?: string;
    inbox?: string;
  }>();
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const colors = isDark ? AppColors.dark : AppColors.light;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isInbox = inbox === "true";

  const { addTask, addToInbox, hapticsEnabled, tasks } = useTaskContext();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedColor, setSelectedColor] = useState(AppColors.primary);
  const [selectedIcon, setSelectedIcon] = useState("check-square");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [duration, setDuration] = useState(30);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);

  const targetDate = date || todayStr();

  const suggestions = tasks
    .filter((t) => t.startTime && !t.isCompleted)
    .sort((a, b) => (a.startTime! > b.startTime! ? 1 : -1))
    .slice(0, 4);

  const handleContinue = () => {
    if (step === 0 && !title.trim()) {
      if (hapticsEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isInbox || step === 1) {
      handleSave();
    } else {
      setStep((s) => Math.min(s + 1, 2));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const startTime = isInbox
      ? undefined
      : new Date(
          `${targetDate}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`,
        ).toISOString();

    const taskData = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      startTime,
      durationMinutes: duration,
      colorValue: selectedColor,
      iconName: selectedIcon,
      isCompleted: false,
      subtasks: [],
      recurrence,
      recurrenceDays: [],
      notificationMinutesBefore: 5,
      date: targetDate,
    };

    if (isInbox) {
      await addToInbox(taskData);
    } else {
      await addTask(taskData);
    }
    router.back();
  };

  const heroColor = selectedColor;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}
    >
      <View style={styles.handle}>
        <View style={[styles.handleBar, { backgroundColor: heroColor }]} />
      </View>

      <View style={[styles.hero, { backgroundColor: heroColor }]}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
            style={styles.heroCloseBtn}
          >
            <Feather name="x" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
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
                    borderWidth: selectedColor === c ? 2.5 : 0,
                    borderColor: "rgba(255,255,255,0.9)",
                    transform: [{ scale: selectedColor === c ? 1.1 : 1 }],
                  },
                ]}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.heroContent}>
          <TouchableOpacity
            style={styles.heroIconCircle}
            onPress={() => setShowIconPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Feather name={selectedIcon as any} size={24} color="#FFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.heroTitleInput}
            placeholder="Task title"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={title}
            onChangeText={setTitle}
            autoFocus={step === 0}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={() => step === 0 && setStep(1)}
          />
          <View style={styles.heroRingCircle}>
            <Feather name="circle" size={22} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showIconPicker && (
          <View
            style={[styles.card, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.cardSectionTitle, { color: colors.label }]}>
              Choose Icon
            </Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.name}
                  onPress={() => {
                    setSelectedIcon(opt.name);
                    setShowIconPicker(false);
                    if (hapticsEnabled) Haptics.selectionAsync();
                  }}
                  style={[
                    styles.iconGridItem,
                    {
                      backgroundColor:
                        selectedIcon === opt.name
                          ? selectedColor + "30"
                          : colors.separator + "60",
                      borderWidth: selectedIcon === opt.name ? 2 : 0,
                      borderColor: selectedColor,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={opt.name as any}
                    size={22}
                    color={
                      selectedIcon === opt.name ? selectedColor : colors.label
                    }
                  />
                  <Text
                    style={[
                      styles.iconGridLabel,
                      {
                        color:
                          selectedIcon === opt.name
                            ? selectedColor
                            : colors.tertiaryLabel,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 0 && !isInbox && (
          <>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsBlock}>
                <Text
                  style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}
                >
                  Suggestions
                </Text>
                <View
                  style={[
                    styles.suggestionsCard,
                    { backgroundColor: colors.cardBackground },
                  ]}
                >
                  {suggestions.map((t, idx) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.suggestionRow,
                        idx < suggestions.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.separator,
                        },
                      ]}
                      onPress={() => {
                        setTitle(t.title);
                        setSelectedColor(t.colorValue);
                        setDuration(t.durationMinutes);
                        if (hapticsEnabled) Haptics.selectionAsync();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.suggDot,
                          { backgroundColor: t.colorValue },
                        ]}
                      />
                      <View style={styles.suggText}>
                        <Text
                          style={[
                            styles.suggTime,
                            { color: colors.tertiaryLabel },
                          ]}
                        >
                          {t.startTime
                            ? new Date(t.startTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )
                            : ""}{" "}
                          ({t.durationMinutes}m)
                        </Text>
                        <Text
                          style={[styles.suggTitle, { color: colors.label }]}
                          numberOfLines={1}
                        >
                          {t.title}
                        </Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={colors.tertiaryLabel}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <TextInput
                style={[styles.notesInput, { color: colors.label }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.tertiaryLabel}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </>
        )}

        {step === 1 && !isInbox && (
          <>
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <View style={styles.dateRow}>
                <Feather
                  name="calendar"
                  size={18}
                  color={colors.tertiaryLabel}
                />
                <Text style={[styles.dateText, { color: colors.label }]}>
                  {new Date(targetDate + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.todayBadge,
                    { backgroundColor: heroColor + "22" },
                  ]}
                >
                  <Text style={[styles.todayText, { color: heroColor }]}>
                    Today
                  </Text>
                  <Feather name="chevron-right" size={13} color={heroColor} />
                </TouchableOpacity>
              </View>
            </View>

            <TimePickerDrum
              selectedHour={startHour}
              selectedMinute={startMinute}
              onHourChange={setStartHour}
              onMinuteChange={setStartMinute}
              isDark={isDark}
              accentColor={heroColor}
            />

            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <Text style={[styles.cardSectionTitle, { color: colors.label }]}>
                Duration
              </Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setDuration(opt.value);
                      if (hapticsEnabled) Haptics.selectionAsync();
                    }}
                    style={[
                      styles.durationPill,
                      {
                        backgroundColor:
                          duration === opt.value ? heroColor : colors.separator,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        {
                          color: duration === opt.value ? "#FFF" : colors.label,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {step === 2 && !isInbox && (
          <>
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <Text style={[styles.cardSectionTitle, { color: colors.label }]}>
                Repeat
              </Text>
              <View style={styles.pillRow}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setRecurrence(opt.value);
                      if (hapticsEnabled) Haptics.selectionAsync();
                    }}
                    style={[
                      styles.durationPill,
                      {
                        backgroundColor:
                          recurrence === opt.value
                            ? heroColor
                            : colors.separator,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        {
                          color:
                            recurrence === opt.value ? "#FFF" : colors.label,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <TextInput
                style={[styles.notesInput, { color: colors.label }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.tertiaryLabel}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </>
        )}

        {isInbox && (
          <>
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <TextInput
                style={[styles.notesInput, { color: colors.label }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.tertiaryLabel}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
            <View
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <Text style={[styles.cardSectionTitle, { color: colors.label }]}>
                Duration
              </Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setDuration(opt.value);
                      if (hapticsEnabled) Haptics.selectionAsync();
                    }}
                    style={[
                      styles.durationPill,
                      {
                        backgroundColor:
                          duration === opt.value ? heroColor : colors.separator,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        {
                          color: duration === opt.value ? "#FFF" : colors.label,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad + 8,
            backgroundColor: colors.scaffoldBackground,
            borderTopColor: colors.separator,
          },
        ]}
      >
        {!isInbox && (
          <View style={styles.stepDots}>
            <StepDot active={step === 0} isDark={isDark} />
            <StepDot active={step === 1} isDark={isDark} />
            <StepDot active={step === 2} isDark={isDark} />
          </View>
        )}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!title.trim()}
          style={[
            styles.continueBtn,
            { backgroundColor: title.trim() ? heroColor : colors.separator },
          ]}
          activeOpacity={0.88}
        >
          <Text
            style={[
              styles.continueBtnText,
              { color: title.trim() ? "#FFF" : colors.tertiaryLabel },
            ]}
          >
            {step === 2 || isInbox ? "Create Task" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: { paddingTop: 10, alignItems: "center" },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  heroCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  colorRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  colorCircle: { width: 26, height: 26, borderRadius: 13 },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroTitleInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  heroRingCircle: { paddingLeft: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  suggestionsBlock: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginLeft: 4 },
  suggestionsCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  suggText: { flex: 1 },
  suggTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  suggTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    padding: 16,
    paddingBottom: 10,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  iconGridItem: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconGridLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  notesInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 16,
    minHeight: 60,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 2,
  },
  todayText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  drumWrap: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  drumLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  drum: { flexDirection: "row", gap: 8 },
  drumCol: { flex: 1, gap: 2 },
  drumItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  drumItemText: { textAlign: "center" },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: "wrap",
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: "wrap",
  },
  durationPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22 },
  durationPillText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stepDots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  continueBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  continueBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
});
