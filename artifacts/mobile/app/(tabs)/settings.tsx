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
  iconBg,
  iconColor,
  label,
  sublabel,
  value,
  rightEl,
  onPress,
  isDark,
  isLast,
}: {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  rightEl?: React.ReactNode;
  onPress?: () => void;
  isDark: boolean;
  isLast?: boolean;
}) {
  const colors = isDark ? AppColors.dark : AppColors.light;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightEl}
      activeOpacity={onPress ? 0.6 : 1}
      style={[
        styles.settRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <View style={[styles.settIcon, { backgroundColor: iconBg ?? AppColors.light.primaryBg }]}>
        <Feather name={icon as any} size={16} color={iconColor ?? AppColors.light.primary} />
      </View>
      <View style={styles.settText}>
        <Text style={[styles.settLabel, { color: colors.label }]}>{label}</Text>
        {sublabel ? <Text style={[styles.settSub, { color: colors.tertiaryLabel }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[styles.settValue, { color: colors.tertiaryLabel }]}>{value}</Text> : null}
      {rightEl}
      {onPress && !rightEl && <Feather name="chevron-right" size={15} color={colors.tertiaryLabel} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? AppColors.dark : AppColors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 120 : insets.bottom + 100;

  const {
    hapticsEnabled, setHapticsEnabled,
    timeFormat, setTimeFormat,
    firstDayOfWeek, setFirstDayOfWeek,
    themeMode, setThemeMode,
  } = useTaskContext();

  return (
    <View style={[styles.container, { backgroundColor: colors.scaffoldBackground }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: topPad + 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageTitle}>
          <Text style={[styles.pageTitleText, { color: colors.label }]}>Settings</Text>
          <Text style={[styles.pageTitleSub, { color: colors.tertiaryLabel }]}>
            Tailor your mindful journey. Manage your preferences, data synchronization, and premium features.
          </Text>
        </View>

        {/* PRO card */}
        <View style={styles.proCard}>
          <View style={styles.proCardTop}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO FEATURE</Text>
            </View>
            <Text style={styles.proTitle}>Unlock Your{"\n"}Potential</Text>
            <Text style={styles.proSub}>
              Get unlimited projects, advanced analytics, and priority cloud sync across all your devices.
            </Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
            <Text style={[styles.upgradeBtnText, { color: colors.proCardBg }]}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>

        {/* General preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>GENERAL PREFERENCES</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
            <SettingsRow
              icon="cloud"
              iconBg="#E8F0FE"
              iconColor="#1A73E8"
              label="Sync with iCloud"
              sublabel="Keep your data safe and updated everywhere"
              isDark={isDark}
              rightEl={
                <Switch
                  value={true}
                  trackColor={{ false: colors.separator, true: AppColors.light.primaryLight }}
                  thumbColor={AppColors.light.primary}
                  ios_backgroundColor={colors.separator}
                />
              }
            />
            <SettingsRow
              icon="bell"
              iconBg="#FCE8EA"
              iconColor="#D93025"
              label="Import Reminders"
              sublabel="Seamlessly merge your existing iOS lists"
              isDark={isDark}
              rightEl={
                <TouchableOpacity style={[styles.connectBtn, { borderColor: AppColors.light.primary }]}>
                  <Text style={[styles.connectBtnText, { color: AppColors.light.primary }]}>Connect</Text>
                </TouchableOpacity>
              }
            />
            <SettingsRow
              icon="bell"
              iconBg={AppColors.light.primaryBg}
              iconColor={AppColors.light.primary}
              label="Notifications"
              sublabel="Gentle nudges for your mindful moments"
              isDark={isDark}
              isLast
              rightEl={
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(val) => {
                    if (val) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setHapticsEnabled(val);
                  }}
                  trackColor={{ false: colors.separator, true: AppColors.light.primaryLight }}
                  thumbColor={hapticsEnabled ? AppColors.light.primary : colors.tertiaryLabel}
                  ios_backgroundColor={colors.separator}
                />
              }
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>APPEARANCE</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
            <SettingsRow
              icon="sun"
              label="Theme"
              value={themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark"}
              onPress={() => {
                const modes: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];
                const next = modes[(modes.indexOf(themeMode) + 1) % 3];
                if (hapticsEnabled) Haptics.selectionAsync();
                setThemeMode(next);
              }}
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
          </View>
        </View>

        {/* Sync devices */}
        <View style={[styles.syncCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.syncIcons}>
            <View style={[styles.syncIcon, { backgroundColor: AppColors.light.primaryBg }]}>
              <Feather name="smartphone" size={18} color={AppColors.light.primary} />
            </View>
            <View style={[styles.syncIcon, { backgroundColor: "#E8F0FE" }]}>
              <Feather name="zap" size={18} color="#1A73E8" />
            </View>
          </View>
          <Text style={[styles.syncTitle, { color: colors.label }]}>Sync across all devices</Text>
          <Text style={[styles.syncSub, { color: colors.tertiaryLabel }]}>
            Your mindful practice should never be interrupted. Start a task on your phone, track it on your laptop, and review it on your tablet.
          </Text>
          <View style={styles.platformPills}>
            {["iOS", "macOS", "Web"].map((p) => (
              <View key={p} style={[styles.platformPill, { backgroundColor: colors.separator }]}>
                <Text style={[styles.platformPillText, { color: colors.secondaryLabel }]}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.tertiaryLabel }]}>YOUR PROFILE</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.profileRow}>
              <View style={[styles.profileAvatar, { backgroundColor: AppColors.light.primaryLight }]}>
                <Feather name="user" size={22} color={AppColors.light.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.label }]}>You</Text>
                <Text style={[styles.profileSince, { color: colors.tertiaryLabel }]}>Free Member</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <SettingsRow icon="user" label="Account Details" onPress={() => {}} isDark={isDark} />
            <SettingsRow icon="shield" label="Privacy & Security" onPress={() => {}} isDark={isDark} isLast />
          </View>
        </View>

        {/* Log out */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.cardBackground }]}>
          <Feather name="log-out" size={16} color="#D93025" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: { flex: 1 },

  pageTitle: { paddingHorizontal: 20, gap: 6 },
  pageTitleText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  pageTitleSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  proCard: {
    marginHorizontal: 16, borderRadius: 20, overflow: "hidden",
    backgroundColor: "#6D2B37",
  },
  proCardTop: { padding: 20, gap: 8 },
  proBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  proBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: 0.8 },
  proTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFFFFF", lineHeight: 30 },
  proSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", lineHeight: 18 },
  upgradeBtn: {
    backgroundColor: "#FFFFFF", marginHorizontal: 20, marginBottom: 20,
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  upgradeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },

  section: { gap: 8, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8, textTransform: "uppercase", marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  settRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12, minHeight: 56,
  },
  settIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  settText: { flex: 1 },
  settLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  settSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  settValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  connectBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1.5,
  },
  connectBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  syncCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 20, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  syncIcons: { flexDirection: "row", gap: 8 },
  syncIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  syncTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  syncSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  platformPills: { flexDirection: "row", gap: 8 },
  platformPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  platformPillText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  profileRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  profileAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  profileSince: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  logoutBtn: {
    marginHorizontal: 16, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#D93025" },
});
