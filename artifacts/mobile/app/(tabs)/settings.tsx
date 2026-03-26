import { Feather, MaterialIcons } from "@expo/vector-icons";
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

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDark: boolean;
  showChevron?: boolean;
}

function SettingsRow({ label, value, onPress, rightElement, isDark, showChevron }: SettingsRowProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { borderBottomColor: colors.separator }]}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.rowLabel, { color: colors.label }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.tertiaryLabel }]}>{value}</Text>}
        {rightElement}
        {showChevron && onPress && (
          <Feather name="chevron-right" size={18} color={colors.tertiaryLabel} />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}

function SettingsSection({ title, children, isDark }: SettingsSectionProps) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.tertiaryLabel }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
        {children}
      </View>
    </View>
  );
}

function ColorButton({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.colorBtn,
        { backgroundColor: color },
        selected && styles.colorBtnSelected,
      ]}
      activeOpacity={0.8}
    >
      {selected && <Feather name="check" size={12} color="#FFF" />}
    </TouchableOpacity>
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

  const themeCycleOrder: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];
  const themeLabels = { system: "System", light: "Light", dark: "Dark" };

  const handleThemeCycle = () => {
    const current = themeCycleOrder.indexOf(themeMode);
    const next = themeCycleOrder[(current + 1) % 3];
    if (hapticsEnabled) Haptics.selectionAsync();
    setThemeMode(next);
  };

  const handleTimeFormat = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setTimeFormat(timeFormat === "12h" ? "24h" : "12h");
  };

  const handleFirstDay = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setFirstDayOfWeek(firstDayOfWeek === 1 ? 0 : 1);
  };

  const handleHaptics = (val: boolean) => {
    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHapticsEnabled(val);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.label }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Appearance" isDark={isDark}>
          <SettingsRow
            label="Theme"
            value={themeLabels[themeMode]}
            onPress={handleThemeCycle}
            isDark={isDark}
            showChevron
          />
          <SettingsRow
            label="Time Format"
            value={timeFormat === "12h" ? "12-hour" : "24-hour"}
            onPress={handleTimeFormat}
            isDark={isDark}
            showChevron
          />
          <SettingsRow
            label="Week Starts On"
            value={firstDayOfWeek === 1 ? "Monday" : "Sunday"}
            onPress={handleFirstDay}
            isDark={isDark}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title="Interactions" isDark={isDark}>
          <SettingsRow
            label="Haptic Feedback"
            isDark={isDark}
            rightElement={
              <Switch
                value={hapticsEnabled}
                onValueChange={handleHaptics}
                trackColor={{ false: colors.separator, true: AppColors.primaryBlue + "80" }}
                thumbColor={hapticsEnabled ? AppColors.primaryBlue : colors.tertiaryLabel}
                ios_backgroundColor={colors.separator}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Task Colors" isDark={isDark}>
          <View style={styles.colorsGrid}>
            {AppColors.taskColors.map((c) => (
              <ColorButton
                key={c}
                color={c}
                selected={false}
                onPress={() => {
                  if (hapticsEnabled) Haptics.selectionAsync();
                }}
              />
            ))}
          </View>
        </SettingsSection>

        <SettingsSection title="About" isDark={isDark}>
          <SettingsRow label="Version" value="1.0.0" isDark={isDark} />
          <SettingsRow label="App" value="Structured Daily Planner" isDark={isDark} />
        </SettingsSection>
      </ScrollView>
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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorBtnSelected: {
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
