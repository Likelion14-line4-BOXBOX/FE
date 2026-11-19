import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getHome } from "../../api/homeApi";

export const HOME_API_ENABLED =
  import.meta.env.VITE_HOME_API_ENABLED === "true";

export default function useHomeData({
  accessToken = null,
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(HOME_API_ENABLED);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => {
    setRequestKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (!HOME_API_ENABLED) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getHome({
          accessToken,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message ||
              "홈 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [accessToken, requestKey]);

  // 화면을 켜둔 상태에서도 다음 경기·세션을 다시 확인
  useEffect(() => {
    if (!HOME_API_ENABLED) return;

    const timer = window.setInterval(retry, 60_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        retry();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [retry]);

  return {
    data,
    loading,
    error,
    retry,
  };
}