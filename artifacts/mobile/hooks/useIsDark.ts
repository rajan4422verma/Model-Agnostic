import { useColorScheme } from "react-native";
import { useTaskContext } from "@/context/TaskContext";

export function useIsDark(): boolean {
  const colorScheme = useColorScheme();
  const { themeMode } = useTaskContext();
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  return colorScheme === "dark";
}
