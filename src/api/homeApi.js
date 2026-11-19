const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getHome({
  accessToken,
  signal,
} = {}) {
  const response = await fetch(`${API_BASE_URL}/home`, {
    credentials: "include",
    signal: signal
      ? AbortSignal.any([
          signal,
          AbortSignal.timeout(8000),
        ])
      : AbortSignal.timeout(8000),
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

  const data = payload?.data;

  if (
    !data ||
    typeof data !== "object" ||
    !Object.hasOwn(data, "nextRace")
  ) {
    throw new Error("홈 API 응답 형식을 확인해 주세요.");
  }

  return {
    ...data,
    featuredPosts: Array.isArray(data.featuredPosts)
      ? data.featuredPosts
      : [],
  };
}