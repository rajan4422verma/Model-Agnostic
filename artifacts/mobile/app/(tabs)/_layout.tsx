import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppColors from "@/constants/colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.light.primary,
        tabBarInactiveTintColor: AppColors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : isDark ? "#1C1B1F" : "#FFFFFF",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? AppColors.dark.separator : AppColors.light.separator,
          elevation: 0,
          height: Platform.OS === "web" ? 80 : undefined,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI Assist",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.aiTabIcon,
                { backgroundColor: focused ? AppColors.light.primary : "transparent" },
              ]}
            >
              <Feather
                name="zap"
                size={20}
                color={focused ? "#FFF" : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-square" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  aiTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
