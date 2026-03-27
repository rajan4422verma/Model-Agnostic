import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import { TaskProvider } from "@/context/TaskContext";
import { setupNotifications } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="task-detail"
        options={{ presentation: "formSheet", headerShown: false }}
      />
      <Stack.Screen
        name="task-create"
        options={{ presentation: "formSheet", headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Request permissions and set up Android channel
    setupNotifications();

    if (Platform.OS === 'web') return;

    // Foreground notification handler — shows an Alert with haptic
    notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const title = notification.request.content.title ?? "Task Starting";
      const body = notification.request.content.body ?? "";

      // Strong haptic pulse
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 600);

      Alert.alert(title, body, [{ text: "Got it", style: "default" }], {
        cancelable: false,
      });
    });

    // Tap-on-notification handler (app was in background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <TaskProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </TaskProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
