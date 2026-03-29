const SUPABASE_URL = "https://oqupehpgehwzyrifzwdt.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdXBlaHBnZWh3enlyaWZ6d2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzQ4ODYsImV4cCI6MjA5MDI1MDg4Nn0.WU8MGwpk1mpIp9xH6DScMFnCEDjw5GNBfIeHUV14FL4";

export async function saveTask(task: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(task),
  });
}

export async function getAllTasks(userEmail: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tasks?user_email=eq.${userEmail}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  return await res.json();
}

export async function saveToHistory(task: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(task),
  });
}

export async function getHistory(userEmail: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/history?user_email=eq.${userEmail}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  return await res.json();
}
