import { useCallback, useEffect, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

// true: 목업만 사용
// false 또는 미설정: API 우선, 조회 실패 시 목업 표시
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    signal: options.signal
      ? AbortSignal.any([
          options.signal,
          AbortSignal.timeout(8000),
        ])
      : AbortSignal.timeout(8000),
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
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

    const error = new Error(
      body.error?.message ??
        messages[response.status] ??
        "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );

    error.status = response.status;
    error.code = body.error?.code;

    throw error;
  }

  if (!body.data || typeof body.data !== "object") {
    throw new Error("API 응답 형식을 확인해 주세요.");
  }

  if (
    path === "/me" &&
    (typeof body.data.userId !== "string" ||
      typeof body.data.nickname !== "string")
  ) {
    throw new Error("프로필 응답 형식을 확인해 주세요.");
  }

  if (
    path === "/me/portfolio" &&
    (body.data.totalAssets == null ||
      !Number.isFinite(Number(body.data.totalAssets)))
  ) {
    throw new Error("자산 응답 형식을 확인해 주세요.");
  }

  if (
    path.includes("/race-stamps") &&
    (!Number.isInteger(body.data.watchedCount) ||
      !Number.isInteger(body.data.totalRaces))
  ) {
    throw new Error("도장판 응답 형식을 확인해 주세요.");
  }

  return body.data;
}

// 아래 ID는 목업 전용입니다.
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

const mockTeams = mockTeamData.map(
  ([teamId, name], index) => ({
    teamId,
    name,
    championshipRank: index + 1,
  }),
);

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
  favoriteTeam: mockTeams.find(
    (team) => team.teamId === "ferrari",
  ),
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

export function getMockGarageData() {
  return copy({
    profile: mockProfile,
    market: mockMarket,
    stamps: mockStamps,
    teams: mockTeams,
    drivers: mockDrivers,
  });
}

export function getGarageAccessToken() {
  try {
    return sessionStorage.getItem("boxbox.accessToken");
  } catch {
    return null;
  }
}

// 현재 BE dev에는 reference-data API가 없어
// 공개된 현재 라운드의 선수 응답에서 실제 팀·선수 ID를 가져옵니다.
async function getRoster(options) {
  const { round } = await request(
    "/market/rounds/current",
    options,
  );

  if (!round) {
    return { teams: [], drivers: [] };
  }

  const drivers = [];
  let cursor;

  do {
    const query = new URLSearchParams({ size: "20" });

    if (cursor) {
      query.set("cursor", cursor);
    }

    const page = await request(
      `/market/rounds/${encodeURIComponent(
        round.roundId,
      )}/stocks?${query}`,
      options,
    );

    drivers.push(...page.items.map((item) => item.driver));
    cursor = page.hasNext ? page.nextCursor : null;
  } while (cursor);

  return {
    drivers,
    teams: [
      ...new Map(
        drivers.map((driver) => [
          driver.teamId,
          {
            teamId: driver.teamId,
            name: driver.teamName,
          },
        ]),
      ).values(),
    ],
  };
}

export async function getMyGarageData({
  signal,
  token,
  season,
} = {}) {
  const fallback = getMockGarageData();

  if (USE_MOCK) {
    return {
      ...fallback,
      profileSource: "mock",
      failures: [],
    };
  }

  const options = { signal, token };
  const query =
    season == null
      ? ""
      : `?${new URLSearchParams({
          season: String(season),
        })}`;

  const [profileResult, marketResult, rosterResult] =
    await Promise.allSettled([
      request("/me", options),
      request("/me/portfolio", options),
      getRoster(options),
    ]);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const failures = [];

  const profileSource =
    profileResult.status === "fulfilled"
      ? "api"
      : "fallback";

  const profile =
    profileSource === "api"
      ? profileResult.value
      : fallback.profile;

  if (profileSource === "fallback") {
    failures.push("profile");
  }

  let stamps = fallback.stamps;

  if (profileSource === "api") {
    try {
      stamps = await request(
        `/users/${encodeURIComponent(
          profile.userId,
        )}/race-stamps${query}`,
        options,
      );
    } catch (error) {
      if (signal?.aborted) throw error;
      failures.push("stamps");
    }
  } else {
    failures.push("stamps");
  }

  let market = fallback.market;

  if (marketResult.status === "fulfilled") {
    const value = marketResult.value;

    market = {
      totalAssets: value.totalAssets,
      returnRate: value.seasonReturnRate,
      rank: value.seasonRank,
    };
  } else {
    failures.push("market");
  }

  // 실제 프로필에 목업 ID가 섞이지 않도록 합니다.
  let roster =
    profileSource === "api"
      ? { teams: [], drivers: [] }
      : fallback;

  if (
    profileSource === "api" &&
    rosterResult.status === "fulfilled"
  ) {
    roster = rosterResult.value;
  }

  const teams = [...roster.teams];
  const drivers = [...roster.drivers];

  if (
    profile.favoriteTeam &&
    !teams.some(
      (team) =>
        team.teamId === profile.favoriteTeam.teamId,
    )
  ) {
    teams.push(profile.favoriteTeam);
  }

  if (
    profile.favoriteDriver &&
    !drivers.some(
      (driver) =>
        driver.driverId === profile.favoriteDriver.driverId,
    )
  ) {
    drivers.push(profile.favoriteDriver);
  }

  return {
    profile,
    market,
    stamps,
    teams,
    drivers,
    profileSource,
    failures,
  };
}

export async function updateMyGarageProfile(
  body,
  { token, signal } = {},
) {
  if (USE_MOCK) {
    mockProfile = {
      ...mockProfile,
      ...Object.fromEntries(
        Object.entries(body).filter(
          ([key]) =>
            ![
              "favoriteTeamId",
              "favoriteDriverId",
            ].includes(key),
        ),
      ),
    };

    if ("favoriteTeamId" in body) {
      mockProfile.favoriteTeam =
        mockTeams.find(
          (team) =>
            team.teamId === body.favoriteTeamId,
        ) ?? null;
    }

    if ("favoriteDriverId" in body) {
      mockProfile.favoriteDriver =
        mockDrivers.find(
          (driver) =>
            driver.driverId === body.favoriteDriverId,
        ) ?? null;
    }

    return copy(mockProfile);
  }

  return request("/me", {
    method: "PATCH",
    signal,
    token,
    body: JSON.stringify(body),
  });
}

// 서버 이름을 기존 SVG·선택지 표기에 맞춥니다.
export function displayName(name) {
  return (
    {
      "샤를 르클레르": "샤를 르끌레르",
      레이싱불스: "레이싱 불스",
      레드불: "레드불 레이싱",
    }[name] ?? name
  );
}

export function toGarageProfile(profile) {
  return {
    nickname: profile.nickname ?? "",
    bio: profile.bio ?? "",
    team: displayName(profile.favoriteTeam?.name) ?? null,
    driver:
      displayName(profile.favoriteDriver?.name) ?? null,
    showAssets: profile.showMarketAssets ?? false,
    avatarAssetId: profile.avatarAssetId,
    avatarSrc: "",
    teamRank:
      profile.favoriteTeam?.championshipRank ?? null,
    driverRank:
      profile.favoriteDriver?.championshipRank ?? null,
  };
}

export function createProfilePatch(
  draft,
  profile,
  { teams, drivers, profileSource },
) {
  const patch = {};

  if (draft.nickname.trim() !== profile.nickname) {
    patch.nickname = draft.nickname.trim();
  }

  if (draft.bio !== profile.bio) {
    patch.bio = draft.bio;
  }

  if (draft.showAssets !== profile.showAssets) {
    patch.showMarketAssets = draft.showAssets;
  }

  if (
    draft.team !== profile.team ||
    draft.driver !== profile.driver
  ) {
    if (profileSource === "fallback") {
      throw new Error(
        "서버 프로필을 불러온 후 팀·선수를 변경해 주세요.",
      );
    }

    const team = teams.find(
      (item) => displayName(item.name) === draft.team,
    );

    const driver = drivers.find(
      (item) =>
        displayName(item.name) === draft.driver &&
        item.teamId === team?.teamId,
    );

    if (
      (draft.team && !team) ||
      (draft.driver && !driver)
    ) {
      throw new Error(
        "팀·선수 정보를 다시 확인해 주세요.",
      );
    }

    patch.favoriteTeamId = team?.teamId ?? null;
    patch.favoriteDriverId = driver?.driverId ?? null;
  }

  return patch;
}

export function useMyGarageData({
  enabled,
  token,
  season,
}) {
  const [result, setResult] = useState(() => ({
    ...getMockGarageData(),
    profileSource: USE_MOCK ? "mock" : "fallback",
  }));

  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const retry = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyGarageData({
          token,
          season,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setResult(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [enabled, token, season, revision]);

  return {
    ...result,
    loading,
    error,
    retry,
  };
}