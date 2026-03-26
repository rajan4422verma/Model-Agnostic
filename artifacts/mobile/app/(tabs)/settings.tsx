import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppColors from "@/constants/colors";
import { useTaskContext } from "@/context/TaskContext";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  isDark,
  isLast,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDark: boolean;
  isLast?: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: AppColors.primary + '18' }]}>
        <Feather name={icon as any} size={15} color={AppColors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.tertiaryLabel }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <Feather name="chevron-right" size={16} color={colors.tertiaryLabel} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function Section({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.tertiaryLabel }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const {
    themeMode,
    setThemeMode,
    firstDayOfWeek,
    setFirstDayOfWeek,
    timeFormat,
    setTimeFormat,
    hapticsEnabled,
    setHapticsEnabled,
  } = useTaskContext();

  const themes: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];
  const themeLabels = { system: "System", light: "Light", dark: "Dark" };

  const handleTheme = () => {
    const next = themes[(themes.indexOf(themeMode) + 1) % 3];
    if (hapticsEnabled) Haptics.selectionAsync();
    setThemeMode(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={[styles.headerSub, { color: colors.tertiaryLabel }]}>Preferences</Text>
        <Text style={[styles.headerTitle, { color: colors.label }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Appearance" isDark={isDark}>
          <SettingsRow
            icon="sun"
            label="Theme"
            value={themeLabels[themeMode]}
            onPress={handleTheme}
            isDark={isDark}
          />
          <SettingsRow
            icon="clock"
            label="Time Format"
            value={timeFormat === "12h" ? "12-hour" : "24-hour"}
            onPress={() => {
              if (hapticsEnabled) Haptics.selectionAsync();
              setTimeFormat(timeFormat === "12h" ? "24h" : "12h");
            }}
            isDark={isDark}
          />
          <SettingsRow
            icon="calendar"
            label="Week Starts On"
            value={firstDayOfWeek === 1 ? "Monday" : "Sunday"}
            onPress={() => {
              if (hapticsEnabled) Haptics.selectionAsync();
              setFirstDayOfWeek(firstDayOfWeek === 1 ? 0 : 1);
            }}
            isDark={isDark}
            isLast
          />
        </Section>

        <Section title="Interactions" isDark={isDark}>
          <SettingsRow
            icon="activity"
            label="Haptic Feedback"
            isDark={isDark}
            isLast
            rightElement={
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHapticsEnabled(val);
                }}
                trackColor={{
                  false: colors.separator,
                  true: AppColors.primary + '99',
                }}
                thumbColor={hapticsEnabled ? AppColors.primary : colors.tertiaryLabel}
                ios_backgroundColor={colors.separator}
              />
            }
          />
        </Section>

        <Section title="Task Colors" isDark={isDark}>
          <View style={styles.colorsGrid}>
            {AppColors.taskColors.map((c) => (
              <View
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }]}
              />
            ))}
          </View>
        </Section>

        <Section title="About" isDark={isDark}>
          <SettingsRow icon="info" label="Version" value="1.0.0" isDark={isDark} />
          <SettingsRow
            icon="heart"
            label="Structured Daily Planner"
            value=""
            isDark={isDark}
            isLast
          />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 24,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    minHeight: 52,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 16,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
