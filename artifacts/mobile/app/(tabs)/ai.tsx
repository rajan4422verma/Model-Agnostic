import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/constants/colors";
import { useTaskContext } from "@/context/TaskContext";
import { todayStr } from "@/utils/dateUtils";

function AppHeader() {
  return (
    <View style={styles.darkHeader}>
      <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
        <Feather name="menu" size={22} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>The Mindful Canvas</Text>
      <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Feather name="user" size={18} color="#FFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const TEMPLATES = [
  { icon: "zap", label: "Productive Workday", prompt: "Deep focus blocks, meetings, lunch, and evening wind-down." },
  { icon: "sun", label: "Relaxing Weekend", prompt: "Slow morning, leisure activities, social time, and self-care." },
  { icon: "activity", label: "Active Morning", prompt: "Workout, healthy breakfast, journaling, and planning session." },
];

const SAMPLE_SCHEDULES: Record<string, Array<{ time: string; title: string; duration: string; color: string }>> = {
  "productive workday": [
    { time: "7:00 AM", title: "Morning Meditation", duration: "15 min", color: "#C4B5E8" },
    { time: "7:30 AM", title: "Exercise", duration: "45 min", color: "#A8D8A8" },
    { time: "9:00 AM", title: "Deep Work Block", duration: "2 hr", color: "#AECBFA" },
    { time: "12:00 PM", title: "Lunch Break", duration: "1 hr", color: "#F9D5A7" },
    { time: "1:00 PM", title: "Team Meetings", duration: "1 hr", color: "#F5B4B6" },
    { time: "2:30 PM", title: "Project Review", duration: "1 hr", color: "#AECBFA" },
    { time: "4:00 PM", title: "Email & Admin", duration: "1 hr", color: "#F9D5A7" },
    { time: "5:30 PM", title: "Evening Walk", duration: "30 min", color: "#A8D8A8" },
  ],
  "relaxing weekend": [
    { time: "8:30 AM", title: "Slow Breakfast", duration: "1 hr", color: "#F9D5A7" },
    { time: "10:00 AM", title: "Read or Journal", duration: "1 hr", color: "#C4B5E8" },
    { time: "12:00 PM", title: "Lunch with Friends", duration: "1.5 hr", color: "#F5B4B6" },
    { time: "3:00 PM", title: "Outdoor Activity", duration: "2 hr", color: "#A8D8A8" },
    { time: "6:00 PM", title: "Cooking Dinner", duration: "1 hr", color: "#F9D5A7" },
    { time: "8:00 PM", title: "Movie or Show", duration: "2 hr", color: "#AECBFA" },
  ],
  "active morning": [
    { time: "5:30 AM", title: "Wake Up & Hydrate", duration: "10 min", color: "#A8D5E2" },
    { time: "6:00 AM", title: "Workout Session", duration: "1 hr", color: "#A8D8A8" },
    { time: "7:15 AM", title: "Shower & Prep", duration: "20 min", color: "#F5B4B6" },
    { time: "7:45 AM", title: "Healthy Breakfast", duration: "30 min", color: "#F9D5A7" },
    { time: "8:30 AM", title: "Journaling", duration: "20 min", color: "#C4B5E8" },
    { time: "9:00 AM", title: "Day Planning", duration: "15 min", color: "#AECBFA" },
  ],
};

export default function AIAssistScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  const { addTask, hapticsEnabled } = useTaskContext();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<typeof SAMPLE_SCHEDULES["productive workday"] | null>(null);
  const [applied, setApplied] = useState(false);

  const generateSchedule = async (text: string) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setGeneratedSchedule(null);
    setApplied(false);

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 1800));

    const key = Object.keys(SAMPLE_SCHEDULES).find((k) => text.toLowerCase().includes(k)) ?? "productive workday";
    setGeneratedSchedule(SAMPLE_SCHEDULES[key]);
    setLoading(false);
  };

  const applySchedule = async () => {
    if (!generatedSchedule) return;
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const today = todayStr();
    const colors = ["#F5B4B6", "#A8D5E2", "#A8D8A8", "#F9D5A7", "#C4B5E8", "#AECBFA"];

    for (let i = 0; i < generatedSchedule.length; i++) {
      const item = generatedSchedule[i];
      const [timePart, ampm] = item.time.split(" ");
      const [h, m] = timePart.split(":").map(Number);
      const hour = ampm === "PM" && h !== 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
      const startTime = new Date(`${today}T${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`).toISOString();
      const durMatch = item.duration.match(/([\d.]+)\s*(hr|min)/);
      const durationMinutes = durMatch
        ? durMatch[2] === "hr"
          ? Math.round(parseFloat(durMatch[1]) * 60)
          : parseInt(durMatch[1])
        : 30;

      await addTask({
        title: item.title,
        startTime,
        durationMinutes,
        colorValue: item.color,
        iconName: "task",
        isCompleted: false,
        subtasks: [],
        recurrence: "none",
        recurrenceDays: [],
        notificationMinutesBefore: -1,
        date: today,
      });
    }

    setApplied(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={{ paddingTop: topPad }}>
        <AppHeader />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.label }]}>
            Your day,{"\n"}
            <Text style={{ color: AppColors.light.primary }}>reimagined.</Text>
          </Text>
          <View style={[styles.heroBanner, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.heroBannerIcon}>
              <Feather name="zap" size={18} color={AppColors.light.primary} />
            </View>
            <Text style={[styles.heroBannerText, { color: colors.secondaryLabel }]}>
              Turn your thoughts into a structured day. Our AI understands your natural language and crafts the perfect flow.
            </Text>
          </View>
        </View>

        {/* Decorative abstract shape */}
        <View style={styles.abstractShape}>
          <View style={[styles.abstractOuter, { backgroundColor: AppColors.light.primaryLight + "60" }]}>
            <View style={[styles.abstractMid, { backgroundColor: AppColors.light.primaryLight + "90" }]}>
              <View style={[styles.abstractInner, { backgroundColor: AppColors.light.primary + "70" }]} />
            </View>
          </View>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <Feather name="edit-2" size={14} color={colors.tertiaryLabel} />
            <Text style={[styles.inputLabel, { color: colors.label }]}>Describe your day</Text>
            <Text style={[styles.inputLabelHint, { color: colors.tertiaryLabel }]}>Natural language enabled</Text>
          </View>
          <View style={[styles.inputBox, { backgroundColor: colors.cardBackground, borderColor: colors.separator }]}>
            <TextInput
              style={[styles.input, { color: colors.label }]}
              placeholder={"E.g., 'I have a meeting at 10, gym at 2, and need to finish a report by 5...'"}
              placeholderTextColor={colors.tertiaryLabel}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
              <Feather name="mic" size={18} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          onPress={() => generateSchedule(prompt || "productive workday")}
          disabled={loading}
          style={[styles.generateBtn, { backgroundColor: AppColors.light.primary, opacity: loading ? 0.8 : 1 }]}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Feather name="zap" size={16} color="#FFF" />
              <Text style={styles.generateBtnText}>Generate Schedule</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated schedule result */}
        {generatedSchedule && !loading && (
          <View style={styles.resultSection}>
            <Text style={[styles.resultTitle, { color: colors.label }]}>Your AI Schedule ✨</Text>
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              {generatedSchedule.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.resultRow,
                    idx < generatedSchedule.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                  ]}
                >
                  <View style={[styles.resultIcon, { backgroundColor: item.color + "40" }]}>
                    <View style={[styles.resultDot, { backgroundColor: item.color }]} />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultItemTitle, { color: colors.label }]}>{item.title}</Text>
                    <Text style={[styles.resultItemTime, { color: colors.tertiaryLabel }]}>
                      {item.time} · {item.duration}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {!applied ? (
              <TouchableOpacity
                onPress={applySchedule}
                style={[styles.applyBtn, { backgroundColor: AppColors.light.primary }]}
                activeOpacity={0.88}
              >
                <Feather name="check-circle" size={16} color="#FFF" />
                <Text style={styles.applyBtnText}>Apply to Today's Schedule</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.appliedBanner, { backgroundColor: AppColors.light.primaryBg }]}>
                <Feather name="check-circle" size={18} color={AppColors.light.primary} />
                <Text style={[styles.appliedText, { color: AppColors.light.primary }]}>
                  Schedule applied to today!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Templates */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <Feather name="bookmark" size={15} color={colors.tertiaryLabel} />
            <Text style={[styles.templatesTitle, { color: colors.label }]}>Suggested Templates</Text>
          </View>
          {TEMPLATES.map((t, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setPrompt(t.prompt);
                generateSchedule(t.label);
              }}
              style={[styles.templateRow, { backgroundColor: colors.cardBackground }]}
              activeOpacity={0.7}
            >
              <View style={[styles.templateIcon, { backgroundColor: AppColors.light.primaryBg }]}>
                <Feather name={t.icon as any} size={18} color={AppColors.light.primary} />
              </View>
              <Text style={[styles.templateLabel, { color: colors.label }]}>{t.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          ))}
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
  headerIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  avatarBtn: { alignItems: "flex-end" },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },

  scroll: { flex: 1 },

  hero: { padding: 20, gap: 16 },
  heroTitle: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 40 },
  heroBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroBannerIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: AppColors.light.primaryBg,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  heroBannerText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  abstractShape: { alignItems: "center", marginVertical: 8 },
  abstractOuter: { width: 200, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  abstractMid: { width: 130, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  abstractInner: { width: 60, height: 40, borderRadius: 20 },

  inputSection: { paddingHorizontal: 16, gap: 10 },
  inputLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inputLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  inputLabelHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  inputBox: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 64, lineHeight: 20 },
  micBtn: { alignSelf: "flex-end", marginTop: 4 },

  generateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 16, marginTop: 16, borderRadius: 28, paddingVertical: 16,
    shadowColor: AppColors.light.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  generateBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  resultSection: { padding: 16, gap: 12 },
  resultTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  card: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  resultRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  resultIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  resultDot: { width: 12, height: 12, borderRadius: 6 },
  resultContent: { flex: 1 },
  resultItemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultItemTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  applyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 14,
  },
  applyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  appliedBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, paddingVertical: 14,
  },
  appliedText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  templatesSection: { padding: 16, gap: 10 },
  templatesHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  templatesTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  templateRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  templateIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  templateLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});
