const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getHome({ accessToken, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/home`, {
    signal,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `홈 정보를 불러오지 못했습니다. (${response.status})`,
    );
  }

  if (!payload?.data || !Array.isArray(payload.data.featuredPosts)) {
    throw new Error("홈 API 응답 형식을 확인해 주세요.");
  }

  return payload.data;
}