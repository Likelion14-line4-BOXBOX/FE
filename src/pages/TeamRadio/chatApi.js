import {
  parseSseFrame,
  RadioApiError,
} from "./radioApi";

export function createChatApi({
  baseUrl = "/api",
  getAccessToken = () => null,
}) {
  const base = baseUrl.replace(/\/$/, "");

  async function request(
    method,
    path,
    { query, body, signal } = {},
  ) {
    const params = new URLSearchParams();

    Object.entries(query ?? {}).forEach(
      ([key, value]) => {
        if (value != null && value !== "") {
          params.set(key, String(value));
        }
      },
    );

    const token = getAccessToken();

    const response = await fetch(
      `${base}${path}${params.size ? `?${params}` : ""}`,
      {
        method,
        credentials: "include",
        signal: signal
          ? AbortSignal.any([
              signal,
              AbortSignal.timeout(8000),
            ])
          : AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          ...(body
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
        ...(body
          ? { body: JSON.stringify(body) }
          : {}),
      },
    );

    const payload =
      response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
      throw new RadioApiError(
        response.status,
        payload,
      );
    }

    if (
      response.status !== 204 &&
      !payload?.data
    ) {
      throw new Error(
        "채팅 응답을 확인해 주세요.",
      );
    }

    return payload;
  }

  return {
    getRooms: (query, signal) =>
      request("GET", "/chat-rooms", {
        query,
        signal,
      }),

    getRoom: (id, signal) =>
      request(
        "GET",
        `/chat-rooms/${encodeURIComponent(id)}`,
        { signal },
      ),

    getMessages: (id, query, signal) =>
      request(
        "GET",
        `/chat-rooms/${encodeURIComponent(id)}/messages`,
        { query, signal },
      ),

    sendMessage: (id, body) =>
      request(
        "POST",
        `/chat-rooms/${encodeURIComponent(id)}/messages`,
        { body },
      ),

    deleteMessage: (id, messageId) =>
      request(
        "DELETE",
        `/chat-rooms/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}`,
      ),

    subscribeRoom(
      roomId,
      {
        lastEventId,
        onEvent = () => {},
        onError = () => {},
      } = {},
    ) {
      const controller = new AbortController();
      const seen = new Set();

      let cursor = lastEventId;
      let releaseWait;

      const stop = () => {
        controller.abort();
        releaseWait?.();
      };

      async function run() {
        while (!controller.signal.aborted) {
          let reader;

          try {
            const token = getAccessToken();

            const response = await fetch(
              `${base}/chat-rooms/${encodeURIComponent(roomId)}/events`,
              {
                signal: controller.signal,
                credentials: "include",
                headers: {
                  Accept: "text/event-stream",
                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                  ...(cursor
                    ? {
                        "Last-Event-ID": cursor,
                      }
                    : {}),
                },
              },
            );

            if (!response.ok) {
              throw new RadioApiError(
                response.status,
                await response
                  .json()
                  .catch(() => null),
              );
            }

            if (
              !response.body ||
              !response.headers
                .get("Content-Type")
                ?.includes("text/event-stream")
            ) {
              throw new Error(
                "채팅 연결을 확인해 주세요.",
              );
            }

            reader = response.body.getReader();

            const decoder = new TextDecoder();
            let buffer = "";

            while (!controller.signal.aborted) {
              const { value, done } =
                await reader.read();

              if (done) break;

              buffer += decoder.decode(value, {
                stream: true,
              });

              let boundary;

              while (
                (boundary =
                  /\r\n\r\n|\n\n|\r\r/.exec(buffer))
              ) {
                const frame = buffer.slice(
                  0,
                  boundary.index,
                );

                buffer = buffer.slice(
                  boundary.index +
                    boundary[0].length,
                );

                const parsed = parseSseFrame(frame);

                if (
                  !parsed ||
                  controller.signal.aborted
                ) {
                  continue;
                }

                // id 없는 제어 이벤트는 매번 처리합니다.
                if (
                  parsed.id &&
                  seen.has(parsed.id)
                ) {
                  continue;
                }

                onEvent({
                  ...parsed.data,
                  event: parsed.event,
                });

                if (parsed.id) {
                  cursor = parsed.id;
                  seen.add(parsed.id);

                  if (seen.size > 1000) {
                    seen.delete(
                      seen.values().next().value,
                    );
                  }
                }
              }
            }
          } catch (error) {
            if (controller.signal.aborted) {
              return;
            }

            onError(error);

            if (
              [401, 403, 404, 409].includes(
                error.status,
              )
            ) {
              return;
            }
          } finally {
            if (reader) {
              await reader.cancel().catch(() => {});
              reader.releaseLock();
            }
          }

          if (controller.signal.aborted) {
            return;
          }

          await new Promise((resolve) => {
            const timer = setTimeout(() => {
              releaseWait = null;
              resolve();
            }, 1500);

            releaseWait = () => {
              clearTimeout(timer);
              releaseWait = null;
              resolve();
            };
          });
        }
      }

      void run();

      return stop;
    },
  };
}