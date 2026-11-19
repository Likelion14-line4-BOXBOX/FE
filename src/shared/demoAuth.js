const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
  .replace(/\/+$/, "")
  .replace(/(?:\/api)?$/, "/api");
const storageKey = "boxbox.experience.v1";

export function readExperience() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey));
    if (stored?.mode === "guest") return stored;
    if (stored?.mode === "member" && typeof stored.accessToken === "string"
        && stored.user?.userId && Number.isFinite(stored.expiresAt)) return stored;
  } catch {
    // 저장된 상태가 없으면 체험 선택 화면으로 진입한다.
  }
  return null;
}

export function saveExperience(experience) {
  if (experience) sessionStorage.setItem(storageKey, JSON.stringify(experience));
  else sessionStorage.removeItem(storageKey);
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    ...options,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || "로그인하지 못했어요. 다시 시도해주세요.");
  return body?.data;
}

export async function enterDemo() {
  const tokens = await request("/auth/demo", { method: "POST" });
  if (!tokens?.accessToken || !(tokens.expiresIn > 0)) {
    throw new Error("로그인 응답을 확인할 수 없어요. 다시 시도해주세요.");
  }
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  const user = await request("/me", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!user?.userId) throw new Error("회원 정보를 불러오지 못했어요. 다시 시도해주세요.");
  return { mode: "member", accessToken: tokens.accessToken, expiresAt, user };
}

export async function refreshDemo(experience) {
  const tokens = await request("/auth/refresh", { method: "POST" });
  if (!tokens?.accessToken || !(tokens.expiresIn > 0)) throw new Error("다시 회원 체험을 선택해주세요.");
  return { ...experience, accessToken: tokens.accessToken, expiresAt: Date.now() + tokens.expiresIn * 1000 };
}

export async function leaveDemo() {
  await request("/auth/logout", { method: "POST" });
}
