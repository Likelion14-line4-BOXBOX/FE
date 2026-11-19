import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createChatApi } from "./chatApi";
import {
  chatTimeline,
  mergeMessages,
  roomAt,
} from "./chatSessionModel";

export const CHAT_API_ENABLED =
  import.meta.env.VITE_TEAM_RADIO_CHAT_API_ENABLED ===
  "true";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

function readRadioToken() {
  try {
    return sessionStorage.getItem(
      "boxbox.accessToken",
    );
  } catch {
    return null;
  }
}

export default function useRadioChat({
  enabled,
  selectedRoomId,
  accessToken,
  currentUser: suppliedUser,
}) {
  const token =
    accessToken ??
    suppliedUser?.accessToken ??
    readRadioToken();

  const api = useMemo(
    () =>
      createChatApi({
        baseUrl: BASE_URL,
        getAccessToken: () => token,
      }),
    [token],
  );

  const [rooms, setRooms] = useState([]);
  const [viewer, setViewer] = useState(null);

  const [roomData, setRoomData] = useState({
    id: null,
    messages: [],
    markers: [],
    notices: [],
    nextCursor: null,
    hasNext: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] =
    useState(false);
  const [revision, setRevision] = useState(0);
  const [clock, setClock] =
    useState(() => Date.now());

  const offsetRef = useRef(0);
  const sendingRef = useRef(false);
  const generationRef = useRef(0);

  const retry = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const user = useMemo(
    () =>
      viewer?.token === token
        ? viewer.profile
        : null,
    [viewer, token],
  );

  // 실제 토큰으로 사용자 확인
  useEffect(() => {
    if (!enabled || !token) return;

    const controller = new AbortController();

    async function loadViewer() {
      try {
        const response = await fetch(
          `${BASE_URL}/me`,
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        const payload = await response.json();

        if (
          !response.ok ||
          !payload.data?.userId
        ) {
          throw new Error(
            "로그인을 확인해 주세요.",
          );
        }

        if (!controller.signal.aborted) {
          setViewer({
            token,
            profile: payload.data,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setViewer(null);
          setError(error.message);
        }
      }
    }

    void loadViewer();

    return () => controller.abort();
  }, [enabled, token, revision]);

  // 서버 시각을 기준으로 종료 시각을 확인
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      setClock(
        Date.now() + offsetRef.current,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  // 채팅방 전체 목록 조회
  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let busy = false;

    async function refreshRooms() {
      if (busy) return;
      busy = true;

      try {
        const items = [];
        const seen = new Set();
        let cursor;

        do {
          const response = await api.getRooms(
            { size: 100, cursor },
            controller.signal,
          );

          if (
            !Array.isArray(
              response.data?.items,
            )
          ) {
            throw new Error(
              "채팅방 목록을 확인해 주세요.",
            );
          }

          items.push(...response.data.items);

          const serverTime = Date.parse(
            response.meta?.serverTime,
          );

          if (
            Number.isFinite(serverTime)
          ) {
            offsetRef.current =
              serverTime - Date.now();
          }

          cursor = response.data.hasNext
            ? response.data.nextCursor
            : null;

          if (
            cursor &&
            seen.has(cursor)
          ) {
            throw new Error(
              "채팅방 목록 커서를 확인해 주세요.",
            );
          }

          if (cursor) {
            seen.add(cursor);
          }
        } while (cursor);

        if (!controller.signal.aborted) {
          setRooms((previous) =>
            items.map((item) => ({
              ...previous.find(
                (entry) =>
                  entry.roomId === item.roomId,
              ),
              ...item,
            })),
          );

          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        busy = false;
      }
    }

    void refreshRooms();

    const timer = setInterval(
      refreshRooms,
      15_000,
    );

    const onFocus = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void refreshRooms();
      }
    };

    document.addEventListener(
      "visibilitychange",
      onFocus,
    );

    return () => {
      controller.abort();
      clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        onFocus,
      );
    };
  }, [enabled, api, revision]);

  const races = rooms
    .map((room) => roomAt(room, clock))
    .sort((a, b) => {
      const order = {
        LIVE: 0,
        SCHEDULED: 1,
        ARCHIVED: 2,
      };

      return (
        order[a.status] - order[b.status] ||
        (a.status === "ARCHIVED"
          ? Date.parse(b.closesAt) -
            Date.parse(a.closesAt)
          : Date.parse(a.opensAt) -
            Date.parse(b.opensAt))
      );
    });

  const selected = races.find(
    (room) => room.id === selectedRoomId,
  );

  const roomStatus = selected?.status;
  const archived =
    roomStatus === "ARCHIVED";

  // 현재 방의 이력 조회 → SSE 연결
  useEffect(() => {
    if (!enabled || !selectedRoomId) {
      return;
    }

    const controller = new AbortController();
    const generation =
      ++generationRef.current;

    let stop;
    let joined = false;

    function update(updater) {
      if (
        !controller.signal.aborted &&
        generation === generationRef.current
      ) {
        setRoomData(updater);
      }
    }

    async function start() {
      setLoading(true);

      try {
        const [detail, history] =
          await Promise.all([
            api.getRoom(
              selectedRoomId,
              controller.signal,
            ),
            api.getMessages(
              selectedRoomId,
              { size: 100 },
              controller.signal,
            ),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setRooms((previous) =>
          previous.map((room) =>
            room.roomId === selectedRoomId
              ? { ...room, ...detail.data }
              : room,
          ),
        );

        update({
          id: selectedRoomId,
          messages: mergeMessages(
            [],
            history.data.items,
          ),
          markers:
            history.data.timelineMarkers ?? [],
          notices: [],
          nextCursor:
            history.data.nextCursor,
          hasNext: history.data.hasNext,
        });

        if (
          detail.data.status === "ARCHIVED" ||
          archived
        ) {
          return;
        }

        stop = api.subscribeRoom(
          selectedRoomId,
          {
            lastEventId:
              history.meta?.eventCursor,

            onError: (error) => {
              if (
                !controller.signal.aborted
              ) {
                setError(error.message);
              }
            },

            onEvent: (event) => {
              if (
                controller.signal.aborted
              ) {
                return;
              }

              const payload =
                event.payload ?? {};

              if (
                event.event ===
                  "MESSAGE_CREATED" ||
                event.event ===
                  "MESSAGE_DELETED"
              ) {
                update((previous) => ({
                  ...previous,
                  messages: mergeMessages(
                    previous.messages,
                    [payload],
                  ),
                }));
              } else if (
                event.event ===
                "SESSION_CHANGED"
              ) {
                update((previous) => ({
                  ...previous,
                  markers: [
                    ...previous.markers.filter(
                      (item) =>
                        item.markerId !==
                        payload.markerId,
                    ),
                    payload,
                  ],
                }));
              } else if (
                event.event ===
                  "ONLINE_COUNT_CHANGED" ||
                event.event ===
                  "ROOM_STATUS_CHANGED"
              ) {
                setRooms((previous) =>
                  previous.map((room) =>
                    room.roomId ===
                    selectedRoomId
                      ? {
                          ...room,
                          ...payload,
                        }
                      : room,
                  ),
                );
              } else if (
                event.event ===
                  "STREAM_READY" &&
                !joined &&
                user
              ) {
                joined = true;

                update((previous) => ({
                  ...previous,
                  notices: [
                    ...previous.notices,
                    {
                      id: `self-join-${generation}`,
                      text: `${user.nickname}님이 들어왔습니다.`,
                      createdAt:
                        new Date().toISOString(),
                    },
                  ],
                }));
              } else if (
                event.event ===
                "RESET_REQUIRED"
              ) {
                stop?.();
                retry();
              } else if (
                event.event ===
                "AUTH_REQUIRED"
              ) {
                stop?.();
                setViewer(null);
                setError(
                  "다시 로그인해 주세요.",
                );
              } else if (
                event.event ===
                  "RECONNECT_REQUIRED" ||
                event.event === "STREAM_ERROR"
              ) {
                stop?.();
                retry();
              }
            },
          },
        );
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

    void start();

    return () => {
      controller.abort();
      stop?.();
    };
  }, [
    enabled,
    api,
    selectedRoomId,
    roomStatus,
    archived,
    user,
    retry,
    revision,
  ]);

  async function loadOlder() {
    if (
      loadingOlder ||
      !roomData.hasNext ||
      roomData.id !== selectedRoomId
    ) {
      return;
    }

    const generation =
      generationRef.current;

    setLoadingOlder(true);

    try {
      const response =
        await api.getMessages(
          selectedRoomId,
          {
            size: 100,
            cursor: roomData.nextCursor,
          },
        );

      if (
        generation === generationRef.current
      ) {
        setRoomData((previous) => ({
          ...previous,
          messages: mergeMessages(
            previous.messages,
            response.data.items,
          ),
          markers: [
            ...previous.markers,
            ...(response.data.timelineMarkers ??
              []),
          ],
          hasNext: response.data.hasNext,
          nextCursor:
            response.data.nextCursor,
        }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function sendMessage(
    roomId,
    { text, clientMessageId },
  ) {
    if (!user) {
      throw new Error(
        "로그인 후 이용해 주세요.",
      );
    }

    if (sendingRef.current) return;

    const room = races.find(
      (item) => item.id === roomId,
    );

    if (
      !room?.canSendMessage ||
      room.status !== "LIVE"
    ) {
      throw new Error(
        "현재 채팅 운영 시간이 아닙니다.",
      );
    }

    const content = text.trim();

    if (
      !content ||
      content.length > 500
    ) {
      throw new Error(
        "채팅은 1~500자로 입력해 주세요.",
      );
    }

    sendingRef.current = true;

    const generation =
      generationRef.current;

    try {
      const response =
        await api.sendMessage(roomId, {
          content,
          clientMessageId,
        });

      if (
        generation === generationRef.current
      ) {
        setRoomData((previous) => ({
          ...previous,
          messages: mergeMessages(
            previous.messages,
            [response.data],
          ),
        }));
      }
    } finally {
      sendingRef.current = false;
    }
  }

  async function deleteMessage(
    roomId,
    messageId,
  ) {
    await api.deleteMessage(
      roomId,
      messageId,
    );

    setRoomData((previous) =>
      previous.id !== roomId
        ? previous
        : {
            ...previous,
            messages:
              previous.messages.map(
                (message) =>
                  message.messageId ===
                  messageId
                    ? {
                        ...message,
                        isDeleted: true,
                        sender: null,
                        content: null,
                        canDelete: false,
                      }
                    : message,
              ),
          },
    );
  }

  return {
    races,
    clock,
    currentUser: user,
    loading,
    error,
    retry,
    loadOlder,
    loadingOlder,
    hasOlder:
      roomData.id === selectedRoomId &&
      roomData.hasNext,

    getMessages: (roomId) =>
      roomData.id === roomId
        ? chatTimeline(
            roomData.messages,
            roomData.markers,
            roomData.notices,
            user?.userId,
          )
        : [],

    sendMessage,
    deleteMessage,
  };
}