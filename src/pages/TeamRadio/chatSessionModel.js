const timestamp = (value) =>
  value == null ? NaN : Date.parse(value);

// 운영 시간은 서버의 opensAt/closesAt 기준입니다.
export function roomAt(room, now) {
  const opens = timestamp(room.opensAt);
  const closes = timestamp(room.closesAt);

  const valid =
    Number.isFinite(opens) &&
    Number.isFinite(closes) &&
    closes > opens;

  const status =
    room.status === "ARCHIVED" ||
    (valid && now >= closes)
      ? "ARCHIVED"
      : valid && now >= opens
        ? "LIVE"
        : "SCHEDULED";

  return {
    ...room,
    id: String(room.roomId ?? room.id),
    title: room.raceName ?? room.title,
    round: room.roundNumber ?? room.round,
    status,
    canSendMessage:
      valid &&
      status === "LIVE" &&
      room.canSendMessage === true,
  };
}

export function mergeMessages(previous, incoming) {
  const map = new Map(
    previous.map((item) => [
      String(item.messageId),
      item,
    ]),
  );

  for (const item of incoming) {
    const key = String(item.messageId);
    const existing = map.get(key);

    // 삭제된 메시지를 오래된 생성 응답으로 복구하지 않음
    map.set(key, existing?.isDeleted ? existing : item);
  }

  return [...map.values()].sort(
    (a, b) =>
      timestamp(a.createdAt) - timestamp(b.createdAt) ||
      String(a.messageId).localeCompare(
        String(b.messageId),
      ),
  );
}

export function chatTimeline(
  messages,
  markers,
  notices,
  currentUserId,
) {
  const items = messages.map((message) => ({
    ...message,
    id: String(message.messageId),
    text: message.content,
    mine: Boolean(
      currentUserId &&
        message.sender?.userId === currentUserId,
    ),
    nickname: message.sender?.nickname ?? "",
    date: message.createdAt,
  }));

  const uniqueMarkers = new Map(
    markers.map((item) => [item.markerId, item]),
  );

  for (const marker of uniqueMarkers.values()) {
    items.push({
      id: `marker-${marker.markerId}`,
      systemType: "session",
      text: marker.label,
      createdAt: marker.occurredAt,
      isDeleted: false,
    });
  }

  for (const notice of notices) {
    items.push({
      ...notice,
      systemType: "join",
      isDeleted: false,
    });
  }

  return items.sort(
    (a, b) =>
      timestamp(a.createdAt) - timestamp(b.createdAt) ||
      (a.systemType === "session" ? 0 : 1) -
        (b.systemType === "session" ? 0 : 1) ||
      String(a.id).localeCompare(String(b.id)),
  );
}