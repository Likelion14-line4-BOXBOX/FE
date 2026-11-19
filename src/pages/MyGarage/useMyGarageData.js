import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  USE_MOCK,
  getMyProfile,
  getRaceStamps,
  updateMyGarageProfile,
} from "../../api/myGarageApi";

import {
  getGarageProfile,
  saveGarageProfile,
} from "../../shared/garageProfile";

const EMPTY_PROFILE = {
  nickname: "",
  bio: "",
  team: null,
  driver: null,
  showAssets: false,
  avatarSrc: "",
  teamRank: null,
  driverRank: null,
};

const MOCK_STAMPS = {
  season: 2026,
  watchedCount: 5,
  totalRaces: 23,
  items: [],
};

function toViewProfile(profile) {
  return {
    ...EMPTY_PROFILE,
    userId: profile.userId,
    nickname: profile.nickname ?? "",
    bio: profile.bio ?? "",
    team: profile.favoriteTeam?.name ?? null,
    driver: profile.favoriteDriver?.name ?? null,
    teamRank: profile.favoriteTeam?.championshipRank ?? null,
    driverRank: profile.favoriteDriver?.championshipRank ?? null,
    showAssets: profile.showMarketAssets,
    avatarAssetId: profile.avatarAssetId,

    // avatarAssetIdと画像の対応が未確定なので、
    // APIモードでは既存UIの頭文字表示を使います。
    avatarSrc: "",
  };
}

export default function useMyGarageData({
  currentUser,
  accessToken,
  season,
}) {
  const userId = currentUser?.userId;
  const [mockProfile, setMockProfile] =
    useState(getGarageProfile);

  const [result, setResult] = useState(null);
  const [requestKey, setRequestKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const sessionRef = useRef(null);
  const saveLockRef = useRef(false);

  useEffect(() => {
    if (USE_MOCK || !userId) return;

    const controller = new AbortController();
    sessionRef.current = controller;

    async function load() {
      setResult({
        userId,
        loading: true,
        profile: null,
        stamps: null,
        error: "",
        stampError: "",
      });

      try {
        if (!accessToken) {
          throw new Error(
            "로그인 담당에서 발급받은 액세스 토큰이 필요합니다.",
          );
        }

        const profile = await getMyProfile({
          token: accessToken,
          signal: controller.signal,
        });

        let stamps = null;
        let stampError = "";

        try {
          stamps = await getRaceStamps(profile.userId, {
            token: accessToken,
            signal: controller.signal,
            season,
          });
        } catch (error) {
          if (controller.signal.aborted) return;
          stampError = error.message;
        }

        if (controller.signal.aborted) return;

        setResult({
          userId,
          loading: false,
          profile,
          stamps,
          error: "",
          stampError,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setResult({
          userId,
          loading: false,
          profile: null,
          stamps: null,
          error: error.message,
          stampError: "",
        });
      }
    }

    void load();

    return () => controller.abort();
  }, [userId, accessToken, season, requestKey]);

  const liveResult =
    result?.userId === userId ? result : null;

  const profile = USE_MOCK
    ? mockProfile
    : liveResult?.profile
      ? toViewProfile(liveResult.profile)
      : EMPTY_PROFILE;

  async function persistProfile(draft) {
    if (saveLockRef.current) return null;

    if (USE_MOCK) {
      // 기존 목업 저장 동작 유지
      saveGarageProfile(draft);
      setMockProfile(draft);
      return draft;
    }

    if (
      !accessToken ||
      !liveResult?.profile ||
      liveResult.loading
    ) {
      throw new Error("로그인 및 프로필 조회 상태를 확인해 주세요.");
    }

    // 변경한 필드만 전송합니다.
    // 팀·선수의 목업 ID나 파일 데이터를 서버에 보내지 않습니다.
    const body = {};

    if (draft.nickname.trim() !== profile.nickname) {
      body.nickname = draft.nickname.trim();
    }

    if (draft.bio !== profile.bio) {
      body.bio = draft.bio;
    }

    if (draft.showAssets !== profile.showAssets) {
      body.showMarketAssets = draft.showAssets;
    }

    const controller = sessionRef.current;

    if (!controller || controller.signal.aborted) {
      throw new Error("프로필을 다시 조회해 주세요.");
    }

    saveLockRef.current = true;
    setSaving(true);

    try {
      const updated = await updateMyGarageProfile(body, {
        token: accessToken,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return null;

      // PATCH 응답에는 createdAt/onboardingCompleted가 없으므로
      // 기존 GET 결과와 병합합니다.
      const merged = {
        ...liveResult.profile,
        ...updated,
      };

      setResult((previous) => {
        if (previous?.userId !== userId) return previous;

        return {
          ...previous,
          profile: merged,
        };
      });

      return toViewProfile(merged);
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  }

  const retry = useCallback(() => {
    setRequestKey((previous) => previous + 1);
  }, []);

  return {
    profile,
    stamps: USE_MOCK ? MOCK_STAMPS : liveResult?.stamps,
    loading:
      !USE_MOCK &&
      Boolean(userId) &&
      (!liveResult || liveResult.loading),
    loadError: USE_MOCK ? "" : liveResult?.error ?? "",
    stampError: USE_MOCK ? "" : liveResult?.stampError ?? "",
    saving,
    persistProfile,
    retry,
  };
}