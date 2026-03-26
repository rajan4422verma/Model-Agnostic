import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'custom';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  startTime?: string; // ISO string, null = inbox
  durationMinutes: number;
  colorValue: string; // hex color
  iconName: string; // @expo/vector-icons name
  isCompleted: boolean;
  subtasks: Subtask[];
  recurrence: RecurrenceType;
  recurrenceDays: number[]; // 1=Mon..7=Sun for weekly
  notificationMinutesBefore: number; // -1 = none
  createdAt: string;
  date: string; // YYYY-MM-DD format
}

interface TaskContextType {
  tasks: Task[];
  inboxTasks: Task[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  rescheduleTask: (id: string, newStartTime: string, newDate: string) => Promise<void>;
  getTasksForDate: (date: string) => Task[];
  addToInbox: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  scheduleFromInbox: (id: string, startTime: string, date: string) => Promise<void>;
  deleteFromInbox: (id: string) => Promise<void>;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  firstDayOfWeek: number;
  setFirstDayOfWeek: (day: number) => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

const TASKS_KEY = '@structured_tasks';
const INBOX_KEY = '@structured_inbox';
const SETTINGS_KEY = '@structured_settings';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const SAMPLE_TASKS: Omit<Task, 'id' | 'createdAt'>[] = [
  {
    title: 'Morning Meditation',
    startTime: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
    durationMinutes: 20,
    colorValue: '#9B8FE8',
    iconName: 'self-improvement',
    isCompleted: false,
    subtasks: [],
    recurrence: 'daily',
    recurrenceDays: [],
    notificationMinutesBefore: 5,
    date: todayStr(),
  },
  {
    title: 'Morning Run',
    startTime: new Date(new Date().setHours(7, 30, 0, 0)).toISOString(),
    durationMinutes: 45,
    colorValue: '#5DA85D',
    iconName: 'directions-run',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Breakfast & Coffee',
    startTime: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
    durationMinutes: 30,
    colorValue: '#F5A623',
    iconName: 'coffee',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Deep Work: Project Alpha',
    startTime: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
    durationMinutes: 90,
    colorValue: '#5B8DEF',
    iconName: 'laptop-mac',
    isCompleted: false,
    subtasks: [
      { id: generateId(), title: 'Review requirements', isCompleted: true },
      { id: generateId(), title: 'Write unit tests', isCompleted: false },
      { id: generateId(), title: 'Deploy to staging', isCompleted: false },
    ],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: 10,
    date: todayStr(),
  },
  {
    title: 'Team Standup',
    startTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    durationMinutes: 30,
    colorValue: '#E8734A',
    iconName: 'groups',
    isCompleted: false,
    subtasks: [],
    recurrence: 'weekdays',
    recurrenceDays: [],
    notificationMinutesBefore: 5,
    date: todayStr(),
  },
  {
    title: 'Lunch Break',
    startTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
    durationMinutes: 60,
    colorValue: '#F5A623',
    iconName: 'restaurant',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Design Review',
    startTime: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
    durationMinutes: 60,
    colorValue: '#E84393',
    iconName: 'design-services',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: 10,
    date: todayStr(),
  },
  {
    title: 'Gym Session',
    startTime: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    durationMinutes: 75,
    colorValue: '#5DA85D',
    iconName: 'fitness-center',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: 15,
    date: todayStr(),
  },
  {
    title: 'Read: Atomic Habits',
    startTime: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
    durationMinutes: 45,
    colorValue: '#9B8FE8',
    iconName: 'menu-book',
    isCompleted: false,
    subtasks: [],
    recurrence: 'daily',
    recurrenceDays: [],
    notificationMinutesBefore: 5,
    date: todayStr(),
  },
  {
    title: 'Evening Journaling',
    startTime: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
    durationMinutes: 20,
    colorValue: '#5B8DEF',
    iconName: 'edit-note',
    isCompleted: false,
    subtasks: [],
    recurrence: 'daily',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
];

const INBOX_SAMPLES: Omit<Task, 'id' | 'createdAt'>[] = [
  {
    title: 'Call dentist',
    notes: 'Schedule cleaning appointment',
    durationMinutes: 30,
    colorValue: '#5B8DEF',
    iconName: 'local-hospital',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Buy groceries',
    notes: 'Milk, eggs, bread, coffee',
    durationMinutes: 45,
    colorValue: '#5DA85D',
    iconName: 'shopping-cart',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Review pull requests',
    notes: 'Frontend team PRs for this sprint',
    durationMinutes: 30,
    colorValue: '#9B8FE8',
    iconName: 'code',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Plan weekend trip',
    notes: 'Look into options for hiking trails',
    durationMinutes: 60,
    colorValue: '#4EC9B0',
    iconName: 'explore',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
  {
    title: 'Update resume',
    notes: 'Add recent projects and skills',
    durationMinutes: 90,
    colorValue: '#E8734A',
    iconName: 'description',
    isCompleted: false,
    subtasks: [],
    recurrence: 'none',
    recurrenceDays: [],
    notificationMinutesBefore: -1,
    date: todayStr(),
  },
];

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inboxTasks, setInboxTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState<number>(1);
  const [timeFormat, setTimeFormatState] = useState<'12h' | '24h'>('12h');
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRaw, inboxRaw, settingsRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(INBOX_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (tasksRaw) {
        setTasks(JSON.parse(tasksRaw));
      } else {
        // Seed sample data
        const seeded: Task[] = SAMPLE_TASKS.map((t) => ({
          ...t,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }));
        setTasks(seeded);
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(seeded));
      }

      if (inboxRaw) {
        setInboxTasks(JSON.parse(inboxRaw));
      } else {
        const seededInbox: Task[] = INBOX_SAMPLES.map((t) => ({
          ...t,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }));
        setInboxTasks(seededInbox);
        await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(seededInbox));
      }

      if (settingsRaw) {
        const s = JSON.parse(settingsRaw);
        if (s.themeMode) setThemeModeState(s.themeMode);
        if (s.firstDayOfWeek !== undefined) setFirstDayOfWeekState(s.firstDayOfWeek);
        if (s.timeFormat) setTimeFormatState(s.timeFormat);
        if (s.hapticsEnabled !== undefined) setHapticsEnabledState(s.hapticsEnabled);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  const saveTasks = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
  }, []);

  const saveInbox = useCallback(async (newInbox: Task[]) => {
    setInboxTasks(newInbox);
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(newInbox));
  }, []);

  const saveSettings = useCallback(
    async (patch: Partial<{ themeMode: string; firstDayOfWeek: number; timeFormat: string; hapticsEnabled: boolean }>) => {
      const current = { themeMode, firstDayOfWeek, timeFormat, hapticsEnabled };
      const updated = { ...current, ...patch };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    },
    [themeMode, firstDayOfWeek, timeFormat, hapticsEnabled]
  );

  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt'>) => {
      const newTask: Task = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await saveTasks([...tasks, newTask]);
    },
    [tasks, saveTasks]
  );

  const updateTask = useCallback(
    async (task: Task) => {
      await saveTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    },
    [tasks, saveTasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await saveTasks(tasks.filter((t) => t.id !== id));
    },
    [tasks, saveTasks]
  );

  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      await saveTasks(tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
    },
    [tasks, saveTasks]
  );

  const rescheduleTask = useCallback(
    async (id: string, newStartTime: string, newDate: string) => {
      await saveTasks(
        tasks.map((t) => (t.id === id ? { ...t, startTime: newStartTime, date: newDate } : t))
      );
    },
    [tasks, saveTasks]
  );

  const getTasksForDate = useCallback(
    (date: string) => {
      return tasks.filter((t) => {
        if (t.date === date) return true;
        // recurring logic
        const taskDate = new Date(t.date);
        const targetDate = new Date(date);
        if (targetDate < taskDate) return false;
        if (t.recurrence === 'daily') return true;
        if (t.recurrence === 'weekdays') {
          const day = targetDate.getDay();
          return day >= 1 && day <= 5;
        }
        if (t.recurrence === 'weekly') {
          return taskDate.getDay() === targetDate.getDay();
        }
        if (t.recurrence === 'custom' && t.recurrenceDays.length > 0) {
          const jsDay = targetDate.getDay();
          const mappedDay = jsDay === 0 ? 7 : jsDay;
          return t.recurrenceDays.includes(mappedDay);
        }
        return false;
      });
    },
    [tasks]
  );

  const addToInbox = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt'>) => {
      const newTask: Task = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        startTime: undefined,
      };
      await saveInbox([...inboxTasks, newTask]);
    },
    [inboxTasks, saveInbox]
  );

  const scheduleFromInbox = useCallback(
    async (id: string, startTime: string, date: string) => {
      const task = inboxTasks.find((t) => t.id === id);
      if (!task) return;
      const scheduled = { ...task, startTime, date };
      await Promise.all([
        saveTasks([...tasks, scheduled]),
        saveInbox(inboxTasks.filter((t) => t.id !== id)),
      ]);
    },
    [inboxTasks, tasks, saveTasks, saveInbox]
  );

  const deleteFromInbox = useCallback(
    async (id: string) => {
      await saveInbox(inboxTasks.filter((t) => t.id !== id));
    },
    [inboxTasks, saveInbox]
  );

  const setThemeMode = useCallback(
    async (mode: 'light' | 'dark' | 'system') => {
      setThemeModeState(mode);
      await saveSettings({ themeMode: mode });
    },
    [saveSettings]
  );

  const setFirstDayOfWeek = useCallback(
    async (day: number) => {
      setFirstDayOfWeekState(day);
      await saveSettings({ firstDayOfWeek: day });
    },
    [saveSettings]
  );

  const setTimeFormat = useCallback(
    async (format: '12h' | '24h') => {
      setTimeFormatState(format);
      await saveSettings({ timeFormat: format });
    },
    [saveSettings]
  );

  const setHapticsEnabled = useCallback(
    async (enabled: boolean) => {
      setHapticsEnabledState(enabled);
      await saveSettings({ hapticsEnabled: enabled });
    },
    [saveSettings]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        inboxTasks,
        selectedDate,
        setSelectedDate,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        rescheduleTask,
        getTasksForDate,
        addToInbox,
        scheduleFromInbox,
        deleteFromInbox,
        themeMode,
        setThemeMode,
        firstDayOfWeek,
        setFirstDayOfWeek,
        timeFormat,
        setTimeFormat,
        hapticsEnabled,
        setHapticsEnabled,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used inside TaskProvider');
  return ctx;
}
