import { useEffect, useState } from "react";
import { races } from "./radioData";

export const PREVIEW_ROOM_ID = "preview-las-vegas";

export default function useChatPreview({
  mode,
  nickname = "해머타임기원",
}) {
  const [startedAt] = useState(() => Date.now());
  const [clock, setClock] = useState(() => Date.now());
  const [extraMessages, setExtraMessages] =
    useState([]);
  const [deletedIds, setDeletedIds] =
    useState([]);

  const enabled =
    mode === "live" || mode === "closed";
  const live = mode === "live";
  const roomId = PREVIEW_ROOM_ID;

  const currentUser = {
    userId: "preview-user",
    nickname,
  };

  const at = (minutes) =>
    new Date(
      startedAt + minutes * 60_000,
    ).toISOString();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  const room = {
    id: roomId,
    roomId,
    raceId: races[0].id,
    title: `${races[0].title} (데모)`,
    round: races[0].round,
    status: live ? "LIVE" : "ARCHIVED",
    opensAt: at(-60),
    closesAt: at(live ? 60 : -1),
    onlineCount: 100,
    participantCount: 100,
    canSendMessage: live,
  };

  const sample = [
    {
      id: "preview-1",
      text: "라스베이거스는 야간 레이스라 보는 재미가 있어요.",
      nickname: "닉네임",
      createdAt: at(-40),
      mine: false,
    },
    {
      id: "preview-2",
      text: "이번엔 어떤 팀이 빠를까요?",
      nickname: "닉네임",
      createdAt: at(-39),
      mine: false,
    },
    {
      id: "preview-3",
      text: "직선 구간이 길어서 추월이 기대돼요.",
      nickname: "닉네임",
      createdAt: at(-38),
      mine: false,
    },
    {
      id: "preview-fp2",
      systemType: "session",
      text: "프리 프랙티스 2",
      createdAt: at(-30),
    },
    {
      id: "preview-4",
      text: "첫 랩부터 간격이 좁네요.",
      nickname: "닉네임",
      createdAt: at(-29),
      mine: false,
    },
    {
      id: "preview-5",
      text: "타이어 온도가 관건일 것 같아요.",
      nickname: "닉네임",
      createdAt: at(-28),
      mine: false,
    },
    {
      id: "preview-6",
      text: "피트 타이밍도 같이 봐요.",
      nickname: "닉네임",
      createdAt: at(-27),
      mine: false,
    },
    {
      id: "preview-mine",
      text: "세션 시작하면 같이 이야기해요!",
      nickname,
      createdAt: at(-20),
      mine: true,
      canDelete: true,
    },
    ...(live
      ? [
          {
            id: "preview-join",
            systemType: "join",
            text: `${nickname}님이 들어왔습니다.`,
            createdAt: at(0),
          },
        ]
      : []),
  ];

  return {
    races: [room],
    clock,
    currentUser,
    loading: false,
    error: "",
    hasOlder: false,
    loadingOlder: false,
    loadOlder: async () => {},

    getMessages: (id) =>
      id === roomId
        ? [...sample, ...extraMessages].filter(
            (item) =>
              !deletedIds.includes(item.id),
          )
        : [],

    sendMessage: async (id, { text }) => {
      if (!live || id !== roomId) {
        throw new Error("종료된 채팅입니다.");
      }

      const content = text.trim();

      if (!content || content.length > 500) {
        throw new Error(
          "채팅은 1~500자로 입력해 주세요.",
        );
      }

      // 미리보기에서는 서버에 전송하지 않습니다.
      setExtraMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: content,
          nickname,
          createdAt: new Date().toISOString(),
          mine: true,
          canDelete: true,
        },
      ]);
    },

    deleteMessage: async (id, messageId) => {
      if (!live || id !== roomId) {
        throw new Error("종료된 채팅입니다.");
      }

      setDeletedIds((previous) => [
        ...previous,
        messageId,
      ]);
    },
  };
}
