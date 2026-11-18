const DELAY = 300;

const pending = new Map();
const listeners = new Set();

let visible = false;
let installed = false;

function notify(next) {
  if (visible === next) return;

  visible = next;

  listeners.forEach((listener) => {
    listener();
  });
}

export function subscribeLoading(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getLoadingSnapshot() {
  return visible;
}

let hideTimer = null;

function startRequest() {
  const id = Symbol("api-request");

  // 다음 요청이 바로 시작되면 로딩 종료를 취소
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  const timer = window.setTimeout(() => {
    if (pending.has(id)) {
      notify(true);
    }
  }, DELAY);

  pending.set(id, timer);

  return () => {
    window.clearTimeout(timer);
    pending.delete(id);

    if (pending.size > 0) return;

    if (visible) {
      hideTimer = window.setTimeout(() => {
        hideTimer = null;

        if (pending.size === 0) {
          notify(false);
        }
      }, 200);
    }
  };
}

function shouldTrack(input, options) {
  try {
    const request =
      input instanceof Request ? input : null;

    const headers = new Headers(
      options?.headers ?? request?.headers,
    );

    // 계속 유지하는 채팅 연결은 로딩 대상에서 제외
    const accept = headers.get("Accept") ?? "";

    if (
      accept.toLowerCase().includes("text/event-stream")
    ) {
      return false;
    }

    const apiBase = new URL(
      import.meta.env.VITE_API_BASE_URL || "/api",
      window.location.origin,
    );

    const url = new URL(
      request ? request.url : String(input),
      window.location.href,
    );

    const basePath = apiBase.pathname.replace(/\/+$/, "");

    return (
      url.origin === apiBase.origin &&
      (
        url.pathname === basePath ||
        url.pathname.startsWith(`${basePath}/`)
      )
    );
  } catch {
    return false;
  }
}

export function installLoadingFetch() {
  if (installed) return;

  installed = true;

  const originalFetch = window.fetch;

  async function trackedFetch(input, options) {
    if (!shouldTrack(input, options)) {
      return originalFetch.call(window, input, options);
    }

    const finish = startRequest();

    try {
      const response = await originalFetch.call(
        window,
        input,
        options,
      );

      const contentType =
        response.headers.get("Content-Type") ?? "";

      // JSON 본문 다운로드까지 기다림.
      // 원본 응답은 호출한 API 코드에서 그대로 읽을 수 있음.
      if (
        response.body &&
        contentType.toLowerCase().includes("json")
      ) {
        await response.clone().arrayBuffer();
      }

      return response;
    } finally {
      // 성공·오류·취소 모두 로딩 정리
      finish();
    }
  }

  window.fetch = trackedFetch;

  // 개발 중 파일 변경으로 중복 설치되는 것 방지
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (window.fetch === trackedFetch) {
        window.fetch = originalFetch;
      }

      installed = false;

      pending.forEach((timer) => {
        window.clearTimeout(timer);
      });

      pending.clear();
      notify(false);
      
      window.clearTimeout(hideTimer);
      hideTimer = null;
    });
  }
}