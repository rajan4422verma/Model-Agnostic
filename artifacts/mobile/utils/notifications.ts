import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Storage key for notification ID mapping (taskId -> notificationId)
const NOTIF_MAP_KEY = '@structured_notif_map';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getNotifMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveNotifMap(map: Record<string, string>) {
  await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map));
}

// Request permissions + set up Android channel
export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Android: create a high-importance channel with sound
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-alarms', {
      name: 'Task Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F07B6B',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableVibrate: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Schedule a notification at the task's exact start time
export async function scheduleTaskNotification(
  taskId: string,
  title: string,
  startTimeISO: string,
  durationMinutes: number
): Promise<void> {
  if (Platform.OS === 'web') return;

  const triggerDate = new Date(startTimeISO);
  const now = new Date();

  // Don't schedule if the time is in the past
  if (triggerDate <= now) return;

  // Cancel any existing notification for this task first
  await cancelTaskNotification(taskId);

  const durationLabel =
    durationMinutes < 60
      ? `${durationMinutes} min`
      : durationMinutes % 60 === 0
      ? `${durationMinutes / 60}h`
      : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${title}`,
        body: `Starting now · ${durationLabel}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: 'task-alarms' } : {}),
        data: { taskId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    // Persist the mapping
    const map = await getNotifMap();
    map[taskId] = notifId;
    await saveNotifMap(map);
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
  }
}

// Cancel a scheduled notification for a task
export async function cancelTaskNotification(taskId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const map = await getNotifMap();
    const notifId = map[taskId];
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      delete map[taskId];
      await saveNotifMap(map);
    }
  } catch (e) {
    console.warn('Failed to cancel notification:', e);
  }
}

// Cancel all scheduled notifications (e.g. on app reset)
export async function cancelAllTaskNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIF_MAP_KEY);
}

// Reschedule all tasks (called on app boot to ensure consistency)
export async function rescheduleAllNotifications(
  tasks: Array<{ id: string; title: string; startTime?: string; durationMinutes: number; isCompleted: boolean }>
): Promise<void> {
  if (Platform.OS === 'web') return;
  const now = new Date();

  for (const task of tasks) {
    if (!task.startTime || task.isCompleted) {
      await cancelTaskNotification(task.id);
      continue;
    }
    const triggerDate = new Date(task.startTime);
    if (triggerDate > now) {
      await scheduleTaskNotification(task.id, task.title, task.startTime, task.durationMinutes);
    }
  }
}
