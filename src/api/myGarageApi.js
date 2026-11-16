const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// .env에서 VITE_USE_MOCK=false로 설정하면 실제 API 사용
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const messages = {
      401: "로그인이 필요합니다.",
      404: "요청한 정보를 찾을 수 없습니다.",
      409: "이미 사용 중인 닉네임입니다.",
    };

    throw new Error(
      messages[response.status] ??
        body.error?.message ??
        "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  return body.data;
}

// 아래 ID는 목 데이터 전용.
// 실제 연결 시 /api/reference-data에서 받은 ID를 사용합니다.
const mockTeamData = [
  ["mercedes", "메르세데스", ["조지 러셀", "키미 안토넬리"]],
  ["ferrari", "페라리", ["샤를 르끌레르", "루이스 해밀턴"]],
  ["redbull", "레드불 레이싱", ["막스 베르스타펜", "아이작 하자르"]],
  ["mclaren", "맥라렌", ["랜도 노리스", "오스카 피아스트리"]],
  ["racingbulls", "레이싱 불스", ["리암 로슨", "아비드 린드블라드"]],
  ["astonmartin", "애스턴 마틴", ["페르난도 알론소", "랜스 스트롤"]],
  ["alpine", "알핀", ["피에르 가슬리", "프랑코 콜라핀토"]],
  ["williams", "윌리엄스", ["알렉산더 알본", "카를로스 사인츠"]],
  ["audi", "아우디", ["니코 휠켄베르크", "가브리엘 보르톨레토"]],
  ["cadillac", "캐딜락", ["발테리 보타스", "세르히오 페레즈"]],
  ["haas", "하스", ["올리버 베어먼", "라파엘 카마라"]],
];

const mockTeams = mockTeamData.map(([teamId, name], index) => ({
  teamId,
  name,
  championshipRank: index + 1,
}));

const mockDrivers = mockTeamData.flatMap(
  ([teamId, teamName, names], teamIndex) =>
    names.map((name, index) => ({
      driverId: `${teamId}-${index}`,
      teamId,
      teamName,
      name,
      championshipRank: teamIndex * 2 + index + 1,
    })),
);

let mockProfile = {
  userId: "mock-user",
  nickname: "해머타임기원",
  bio: "해밀턴 8챔 보기 전엔 못 죽음",
  avatarAssetId: null,
  favoriteTeam: mockTeams.find((team) => team.teamId === "ferrari"),
  favoriteDriver: mockDrivers.find(
    (driver) => driver.name === "루이스 해밀턴",
  ),
  showMarketAssets: true,
};

const mockMarket = {
  totalAssets: 100000,
  returnRate: 2.5,
  rank: 1,
};

const mockStamps = {
  season: 2026,
  watchedCount: 5,
  totalRaces: 23,
  items: [],
};

const copy = (value) => structuredClone(value);

export async function getMyGarageData({ signal, token, season } = {}) {
  if (USE_MOCK) {
    return copy({
      profile: mockProfile,
      market: mockMarket,
      stamps: mockStamps,
      teams: mockTeams,
      drivers: mockDrivers,
    });
  }

  const [profile, reference] = await Promise.all([
    request("/api/me", { signal, token }),
    request("/api/reference-data", { signal, token }),
  ]);

  const userId = encodeURIComponent(profile.userId);

  const query =
    season == null
      ? ""
      : `?${new URLSearchParams({ season: String(season) })}`;

  const [garage, stamps] = await Promise.all([
    request(`/api/users/${userId}/garage`, { signal, token }),
    request(`/api/users/${userId}/race-stamps${query}`, {
      signal,
      token,
    }),
  ]);

  return {
    profile,
    market: garage.marketSummary,
    stamps,
    teams: reference.teams,
    drivers: reference.drivers,
  };
}

export async function updateMyGarageProfile(body, { token } = {}) {
  if (USE_MOCK) {
    mockProfile = {
      ...mockProfile,
      nickname: body.nickname,
      bio: body.bio,
      favoriteTeam:
        mockTeams.find((team) => team.teamId === body.favoriteTeamId) ??
        null,
      favoriteDriver:
        mockDrivers.find(
          (driver) => driver.driverId === body.favoriteDriverId,
        ) ?? null,
      showMarketAssets: body.showMarketAssets,
    };

    return copy(mockProfile);
  }

  return request("/api/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}