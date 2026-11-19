import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import hamilton from "../../../assets/images/loading-hamilton.svg";

import {
  subscribeLoading,
  getLoadingSnapshot,
} from "../../../api/loadingFetch";

import LoadingScreen from "./LoadingScreen";

// 앱을 시작할 때 이미지 다운로드를 미리 시작
const preloadImage = new Image();

const imageReadyPromise = new Promise((resolve) => {
  preloadImage.onload = async () => {
    try {
      await preloadImage.decode();
    } catch {
      // decode를 지원하지 않아도 다운로드된 이미지는 사용
    }

    resolve();
  };

  preloadImage.onerror = () => {
    // 이미지 오류가 API 화면 표시를 막지 않도록 처리
    resolve();
  };
});

preloadImage.src = hamilton;

export default function GlobalLoading({ children }) {
  const requestLoading = useSyncExternalStore(
    subscribeLoading,
    getLoadingSnapshot,
    () => false,
  );

  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    let active = true;

    imageReadyPromise.then(() => {
      if (active) {
        setImageReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const loading = requestLoading && imageReady;

  return (
    <>
      <div
        style={{ display: "contents" }}
        inert={loading}
        aria-hidden={loading ? true : undefined}
      >
        {children}
      </div>

      {loading && <LoadingScreen />}
    </>
  );
}