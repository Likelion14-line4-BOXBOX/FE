import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import TeamRadioView from "./TeamRadioView";
import useRadioChat, {
  CHAT_API_ENABLED,
} from "./useRadioChat";
import { useGarageProfile } from "../../shared/garageProfile";

import useChatPreview from "./useChatPreview";

import {
  Asset,
  BackIcon,
  BellIcon,
  MemberIcon,
  PaperPlaneIcon,
} from "./radioChatUi";

import {
  formatChatTime,
  formatKoreanTime,
  formatSessionDate,
} from "./radioModel";

import s from "./TeamRadio.module.scss";
import events from "./ChatEvents.module.scss";

function remaining(value, now) {
  const target = Date.parse(value);

  if (!Number.isFinite(target)) {
    return "일정 미정";
  }

  const minutes = Math.max(
    0,
    Math.ceil((target - now) / 60_000),
  );

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor(
    (minutes % 1440) / 60,
  );

  return [
    days ? `${days}일` : "",
    hours ? `${hours}시간` : "",
    `${minutes % 60}분`,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function TeamRadio(props) {
  const garageProfile = useGarageProfile();
  const [params, setParams] =
    useSearchParams();

  // npm run dev 환경에서만 미리보기 허용
  const requestedPreview =
    import.meta.env.DEV
      ? params.get("preview")
      : null;

  const previewMode = [
    "live",
    "closed",
  ].includes(requestedPreview)
    ? requestedPreview
    : null;

  const view =
    params.get("view") || "home";

  const chatView =
    view === "chat" ||
    Boolean(previewMode);

  const lobbyView =
    !previewMode &&
    view === "home" &&
    params.get("tab") === "chat";

  // 미리보기에서는 실제 채팅 API를 실행하지 않음
  const realChat = useRadioChat({
    enabled:
      !previewMode &&
      CHAT_API_ENABLED &&
      (chatView || lobbyView),
    selectedRoomId:
      chatView && !previewMode
        ? params.get("race")
        : null,
    accessToken: props.accessToken,
    currentUser: props.currentUser,
  });

    const previewChat = useChatPreview({
    mode: previewMode,
    nickname:
        garageProfile.nickname ||
        props.currentUser?.nickname ||
        "해머타임기원",
    });

  const chat = previewMode
    ? previewChat
    : realChat;

  const [input, setInput] =
    useState("");
  const [sending, setSending] =
    useState(false);
  const [error, setError] =
    useState("");
  const [menu, setMenu] =
    useState(null);

  const pageRef = useRef(null);
  const messagesRef = useRef(null);
  const loadedRoomRef = useRef(null);
  const shouldFollowRef =
    useRef(true);
  const operationRef =
    useRef(false);

  const roomId = previewMode
    ? "preview-mexico"
    : params.get("race");

  const room = chat.races.find(
    (item) => item.id === roomId,
  );

  const activeRoom =
    chat.races.find(
      (item) =>
        item.status === "LIVE",
    ) ??
    chat.races.find(
      (item) =>
        item.status === "SCHEDULED",
    );

  const archivedRooms =
    chat.races.filter(
      (item) =>
        item.status === "ARCHIVED",
    );

  const messages = chat
    .getMessages(roomId)
    .filter(
      (message) =>
        !message.isDeleted,
    );

  const canSend = Boolean(
    room?.status === "LIVE" &&
      room.canSendMessage &&
      chat.currentUser,
  );

  useEffect(() => {
    if (!chatView) return;

    const page = pageRef.current;
    const content =
      page?.closest("main.content") ||
      page?.parentElement;

    if (!page || !content) return;

    const resize = () => {
      const height = Math.min(
        874,
        content.clientHeight,
        window.visualViewport?.height ||
          window.innerHeight,
      );

      page.style.setProperty(
        "--chat-height",
        `${height}px`,
      );
    };

    resize();

    const observer =
      new ResizeObserver(resize);

    observer.observe(content);

    window.addEventListener(
      "resize",
      resize,
    );

    window.visualViewport?.addEventListener(
      "resize",
      resize,
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        resize,
      );

      window.visualViewport?.removeEventListener(
        "resize",
        resize,
      );
    };
  }, [chatView]);

  useEffect(() => {
    if (!chatView || chat.loading) {
      return;
    }

    const container =
      messagesRef.current;

    if (!container) return;

    if (
      loadedRoomRef.current !== roomId ||
      shouldFollowRef.current
    ) {
      container.scrollTop =
        container.scrollHeight;

      loadedRoomRef.current =
        roomId;
    }
  }, [
    chatView,
    roomId,
    chat.loading,
    messages.length,
  ]);

  function openRoom(id) {
    setInput("");
    setMenu(null);
    setError("");

    shouldFollowRef.current = true;

    setParams({
      view: "chat",
      race: id,
    });
  }

  async function onScroll(event) {
    const container =
      event.currentTarget;

    shouldFollowRef.current =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      100;

    if (
      container.scrollTop > 24 ||
      !chat.hasOlder ||
      chat.loadingOlder
    ) {
      return;
    }

    const previousHeight =
      container.scrollHeight;

    await chat.loadOlder();

    requestAnimationFrame(() => {
      if (
        messagesRef.current ===
        container
      ) {
        container.scrollTop +=
          container.scrollHeight -
          previousHeight;
      }
    });
  }

  async function send(event) {
    event.preventDefault();

    if (
      !canSend ||
      !input.trim() ||
      operationRef.current
    ) {
      return;
    }

    operationRef.current = true;

    setSending(true);
    setError("");

    try {
      await chat.sendMessage(roomId, {
        text: input,
        clientMessageId:
          crypto.randomUUID(),
      });

      setInput("");
      shouldFollowRef.current = true;

      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop =
            messagesRef.current.scrollHeight;
        }
      });
    } catch (error) {
      setError(error.message);
    } finally {
      operationRef.current = false;
      setSending(false);
    }
  }

  async function removeMessage(id) {
    if (operationRef.current) {
      return;
    }

    operationRef.current = true;

    try {
      await chat.deleteMessage(
        roomId,
        id,
      );

      setMenu(null);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      operationRef.current = false;
    }
  }

  if (
    (!CHAT_API_ENABLED &&
      !previewMode) ||
    (!chatView && !lobbyView)
  ) {
    return (
      <TeamRadioView {...props} />
    );
  }

  return (
    <section
      ref={pageRef}
      className={`${s.page} ${s.gray} ${
        chatView ? s.chatPage : ""
      }`}
      data-radio-focus={
        chatView ? "true" : "false"
      }
    >
      {(error || chat.error) && (
        <p
          role="alert"
          className={s.errorNotice}
        >
          {error || chat.error}
        </p>
      )}

      {lobbyView ? (
        <>
          <div
            className={s.homeHeader}
          >
            <h1 className={s.logo}>
              <Asset
                name="Team Radio"
                fallback="Team Radio"
              />
            </h1>

            <div
              className={s.tabs}
              aria-label="팀 라디오 메뉴"
            >
              {[
                ["board", "게시판"],
                ["chat", "채팅"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={
                    id === "chat"
                  }
                  className={
                    id === "chat"
                      ? s.selected
                      : ""
                  }
                  onClick={() =>
                    setParams({
                      tab: id,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeRoom ? (
            <article
              className={s.liveCard}
            >
              <div
                className={s.liveMeta}
              >
                <Asset
                  name="live"
                  fallback="LIVE"
                  className={
                    s.liveBadge
                  }
                />

                {activeRoom.status ===
                  "LIVE" && (
                  <span
                    className={
                      s.memberCount
                    }
                  >
                    <MemberIcon single />
                    {activeRoom.onlineCount ??
                      0}
                  </span>
                )}

                <small>
                  {activeRoom.status ===
                  "LIVE"
                    ? "종료까지"
                    : "오픈까지"}{" "}
                  {remaining(
                    activeRoom.status ===
                      "LIVE"
                      ? activeRoom.closesAt
                      : activeRoom.opensAt,
                    chat.clock,
                  )}
                </small>
              </div>

              <h2>
                {activeRoom.title}
              </h2>

              <button
                type="button"
                className={s.primary}
                disabled={
                  activeRoom.status !==
                  "LIVE"
                }
                onClick={() =>
                  openRoom(
                    activeRoom.id,
                  )
                }
              >
                {activeRoom.status ===
                "LIVE"
                  ? "입장하기"
                  : "오픈 전"}
              </button>
            </article>
          ) : (
            <p
              className={s.chatEnded}
            >
              {chat.loading
                ? "채팅방을 불러오는 중입니다."
                : "현재 운영 중인 채팅방이 없습니다."}
            </p>
          )}

          <h2>지난 채팅</h2>

          <div className={s.stack}>
            {archivedRooms.map(
              (item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    s.raceCard
                  }
                  onClick={() =>
                    openRoom(item.id)
                  }
                >
                  <span>
                    <small>
                      Round{" "}
                      {item.round}
                    </small>

                    <strong>
                      {item.title}
                    </strong>
                  </span>

                  <span>
                    {item.weekendStartsAt &&
                    item.weekendEndsAt
                      ? `${formatKoreanTime(
                          item.weekendStartsAt,
                        )} ~ ${formatKoreanTime(
                          item.weekendEndsAt,
                        )}`
                      : ""}
                  </span>
                </button>
              ),
            )}
          </div>
        </>
      ) : (
        <div
          className={`${s.chatRoom} ${
            !canSend
              ? s.readOnlyChat
              : ""
          }`}
        >
          <header
            className={s.header}
          >
            <button
              type="button"
              className={
                s.iconButton
              }
              aria-label="뒤로가기"
              onClick={() =>
                setParams({
                  tab: "chat",
                })
              }
            >
              <BackIcon />
            </button>

            <h1>
              {room?.title ??
                "채팅방"}

              {room?.status !==
                "ARCHIVED" && (
                <small
                  className={
                    s.chatLiveMeta
                  }
                >
                  {room?.status ===
                  "LIVE" ? (
                    <>
                      <Asset
                        name="live"
                        fallback="LIVE"
                        className={
                          s.liveBadge
                        }
                      />

                      <span>
                        종료까지{" "}
                        {remaining(
                          room.closesAt,
                          chat.clock,
                        )}
                      </span>
                    </>
                  ) : (
                    "오픈 전"
                  )}
                </small>
              )}
            </h1>

            <span
              className={
                s.memberCount
              }
            >
              <MemberIcon />

              {room?.status ===
              "ARCHIVED"
                ? room.participantCount ??
                  0
                : room?.onlineCount ??
                  0}
            </span>
          </header>

          <div
            className={s.chatNotice}
          >
            <BellIcon />{" "}

            {room?.status === "LIVE"
              ? "경기 시작 전후 1시간 운영 · 종료 후 지난 채팅방에서 열람만 가능"
              : room?.status ===
                  "ARCHIVED"
                ? "종료된 채팅입니다. 조회만 가능합니다."
                : "아직 오픈 전인 채팅방입니다."}
          </div>

          <div
            className={s.messages}
            ref={messagesRef}
            onScroll={onScroll}
          >
            {messages.map(
              (message) => {
                if (
                  message.systemType ===
                  "join"
                ) {
                  return (
                    <p
                      className={
                        events.joinNotice
                      }
                      role="status"
                      key={message.id}
                    >
                      {message.text}
                    </p>
                  );
                }

                if (
                  message.systemType ===
                  "session"
                ) {
                  return (
                    <div
                      className={
                        s.sessionDivider
                      }
                      key={message.id}
                    >
                      <p
                        className={
                          s.session
                        }
                      >
                        {message.text}
                      </p>

                      <p
                        className={
                          s.day
                        }
                      >
                        {formatSessionDate(
                          message.createdAt,
                        )}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                  >
                    <div
                      className={`${s.message} ${
                        message.mine
                          ? s.mine
                          : ""
                      }`}
                    >
                      {!message.mine && (
                        <span
                          className={
                            s.avatar
                          }
                        />
                      )}

                      <div>
                        {!message.mine && (
                          <small>
                            {
                              message.nickname
                            }
                          </small>
                        )}

                        <div
                          className={
                            s.bubbleRow
                          }
                        >
                          <button
                            type="button"
                            className={
                              s.bubble
                            }
                            onContextMenu={(
                              event,
                            ) => {
                              event.preventDefault();

                              if (
                                message.canDelete &&
                                canSend
                              ) {
                                setMenu(
                                  message.id,
                                );
                              }
                            }}
                            onClick={() => {
                              if (
                                message.canDelete &&
                                canSend
                              ) {
                                setMenu(
                                  menu ===
                                    message.id
                                    ? null
                                    : message.id,
                                );
                              }
                            }}
                          >
                            {message.text}
                          </button>

                          <small>
                            {formatChatTime(
                              message.createdAt,
                            )}
                          </small>
                        </div>

                        {menu ===
                          message.id &&
                          message.canDelete &&
                          canSend && (
                            <div
                              className={
                                s.messageMenu
                              }
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  removeMessage(
                                    message.id,
                                  )
                                }
                              >
                                삭제하기
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}

            {!canSend && (
              <p
                className={
                  s.chatEnded
                }
              >
                {chat.loading
                  ? "채팅을 불러오는 중입니다."
                  : room?.status ===
                      "ARCHIVED"
                    ? "라이브 채팅이 종료되었습니다."
                    : !chat.currentUser
                      ? "로그인 후 이용 가능합니다."
                      : room?.status ===
                          "SCHEDULED"
                        ? "아직 채팅방이 열리지 않았어요."
                        : "현재 메시지를 전송할 수 없는 방입니다."}
              </p>
            )}
          </div>

          {canSend && (
            <div
              className={
                s.composerWrap
              }
            >
              <form
                className={
                  s.composer
                }
                onSubmit={send}
              >
                <input
                  aria-label="채팅"
                  placeholder="메시지를 입력해주세요"
                  maxLength={500}
                  value={input}
                  disabled={sending}
                  onChange={(
                    event,
                  ) =>
                    setInput(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="submit"
                  aria-label="채팅 전송"
                  disabled={
                    sending ||
                    !input.trim()
                  }
                >
                  <PaperPlaneIcon />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}