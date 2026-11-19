// API 응답을 기존 화면에서 사용할 데이터로 변환합니다.
// id/body/tag/liked/saved는 화면용 별칭입니다.

export const ALL_TAG = {
  tagId: null,
  name: '전체',
};

export const REPORT_REASONS = [
  { value: 'ABUSE', label: '욕설, 비하' },
  { value: 'SPAM', label: '상업적 광고' },
  { value: 'INAPPROPRIATE', label: '선정적인 내용' },
  { value: 'CLICKBAIT', label: '낚시, 도배' },
  { value: 'OTHER', label: '기타' },
];

export const SORT_VALUES = {
  latest: 'LATEST',
  popular: 'POPULAR',
};

export const PERIOD_VALUES = {
  all: 'ALL',
  1: 'DAY',
  7: 'WEEK',
  30: 'MONTH',
  365: 'YEAR',
};

export function formatKoreanTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatRacePeriod(startsAt, endsAt) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  });
  const dates = [startsAt, endsAt].flatMap((value) => {
    if (!value) return [];
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? []
      : [formatter.format(date).replace('/', '.')];
  });

  return [...new Set(dates)].join(' ~ ') || '일정 미정';
}

export function mapPost(item, currentUserId) {
  return {
    ...item,
    id: item.postId,
    body: item.content ?? item.preview ?? '',
    authorProfile: item.author,
    author: item.author?.nickname ?? '알 수 없는 사용자',
    tag: item.tags?.[0]?.name ?? '전체',
    tagId: item.tags?.[0]?.tagId ?? null,
    images: (item.media ?? []).map((image) => image.url),
    media: item.media ?? [],

    // 비회원의 null 상태를 그대로 보존합니다.
    liked: item.likedByMe,
    saved: item.bookmarkedByMe,

    mine: Boolean(
      currentUserId &&
      item.author?.userId === currentUserId,
    ),
    canEdit: item.canEdit === true,
    canDelete: item.canDelete === true,
    date: formatChatTime(item.createdAt),

    // 댓글은 TR08에서 따로 조회해서 결합합니다.
    comments: [],
  };
}

export function mapComment(item, currentUserId) {
  return {
    ...item,
    id: item.commentId,
    text: item.content,
    replyTo: item.parentId,
    mine:
      !item.isDeleted &&
      Boolean(
        currentUserId &&
        item.author?.userId === currentUserId,
      ),
    liked: item.likedByMe,
    nickname: item.author?.nickname ?? '',
    date: formatChatTime(item.createdAt),
  };
}

export function mapMessage(item, currentUserId) {
  return {
    ...item,
    id: item.messageId,
    text: item.content,
    mine: Boolean(
      currentUserId &&
      item.sender?.userId === currentUserId,
    ),
    nickname: item.sender?.nickname ?? '',
    date: formatKoreanTime(item.createdAt),
  };
}

export function mapRoom(item) {
  return {
    ...item,
    id: item.roomId,
    title: item.raceName,
    round: item.roundNumber,
  };
}

export function mapPostPage(response, currentUserId) {
  return {
    ...response.data,
    items: response.data.items.map((item) =>
      mapPost(item, currentUserId),
    ),

    // 실제 서버가 반환한 인기 글을 그대로 사용합니다.
    popularPost: response.data.popularPost
      ? mapPost(response.data.popularPost, currentUserId)
      : null,
  };
}

export function mapBoardsResponse(
  response,
  presentationByBoardId = {},
) {
  return [...response.data.items]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      ...presentationByBoardId[item.boardId],
      ...item,
      id: item.boardId,

      // 태그는 TR02 조회 후 결합합니다.
      tagOptions: [ALL_TAG],
    }));
}

export function mapTagOptions(response) {
  return [
    ALL_TAG,
    ...response.data.items
      .filter((item) => item.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  ];
}

export function toPostBody(draft) {
  const title = draft.title.trim();
  const content = draft.body.trim();

  if (!title || title.length > 20 || !content) {
    throw new Error(
      '제목은 1~20자로, 내용은 공백만 입력하지 않도록 작성해주세요.',
    );
  }

  if (
    draft.images.length > 5 ||
    draft.images.some((item) => !item.mediaId)
  ) {
    throw new Error(
      '사진은 업로드한 이미지로 최대 5장까지 첨부할 수 있어요.',
    );
  }

  return {
    title,
    content,
    tagIds: draft.tagId ? [draft.tagId] : [],
    mediaIds: draft.images.map((item) => item.mediaId),
  };
}

export function toReportBody(
  target,
  reason,
  description = '',
) {
  const text = description.trim();

  if (
    !target?.targetId ||
    !['POST', 'COMMENT', 'CHAT_MESSAGE'].includes(
      target.targetType,
    )
  ) {
    throw new Error('신고 대상을 확인해주세요.');
  }

  if (
    !REPORT_REASONS.some(
      (item) => item.value === reason,
    )
  ) {
    throw new Error('신고 사유를 선택해주세요.');
  }

  if (
    (reason === 'OTHER' && !text) ||
    text.length > 1000
  ) {
    throw new Error(
      '기타 사유는 1~1000자로 입력해주세요.',
    );
  }

  return {
    ...target,
    reason,
    ...(text ? { description: text } : {}),
  };
}

export function validateImage(file) {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(
      file.type,
    )
  ) {
    throw new Error(
      'JPG, PNG, WEBP 사진을 선택해주세요.',
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      '사진은 한 장당 5MB 이하여야 해요.',
    );
  }
}

// 임시 데이터 정렬용입니다.
// 실제 연동 시 정렬은 TR03/TR22 쿼리로 처리합니다.
export function sortPosts(items, sort = 'latest') {
  return [...items].sort((a, b) =>
    sort === 'popular'
      ? b.likeCount - a.likeCount ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt)
      : Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function toListQuery({
  sort = 'latest',
  period = 'all',
  q,
  tagId,
  cursor,
  size = 20,
  scope,
  boardId,
} = {}) {
  const query = {
    sort: SORT_VALUES[sort] ?? sort,
    period: PERIOD_VALUES[period] ?? period,
    size,
  };

  if (q?.trim()) query.q = q.trim();
  if (tagId) query.tagId = tagId;
  if (cursor) query.cursor = cursor;
  if (scope) query.scope = scope;
  if (boardId) query.boardId = boardId;

  return query;
}

export function findTeamBoard(boards, teamId) {
  return (
    boards.find(
      (item) =>
        item.type === 'TEAM' &&
        item.teamId === teamId,
    ) ?? null
  );
}
export function threadComments(comments) {
  const roots = comments.filter((item) => item.parentId == null);
  const replies = new Map();
  const rootIds = new Set(roots.map((item) => item.commentId));

  for (const item of comments) {
    if (item.parentId == null) continue;

    const siblings = replies.get(item.parentId) ?? [];
    siblings.push(item);
    replies.set(item.parentId, siblings);
  }

  return [
    ...roots.flatMap((item) => [
      item,
      ...(replies.get(item.commentId) ?? []),
    ]),
    ...comments.filter(
      (item) => item.parentId != null && !rootIds.has(item.parentId),
    ),
  ];
}
export function koreanDayKey(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatKoreanDate(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const part = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${part('year')}년 ${part('month')}월 ${part('day')}일`;
}

export function formatPostDate(value, now = Date.now()) {
  const date = new Date(value);
  const current = new Date(now);

  if (!value || Number.isNaN(date.getTime())) return '';

  if (koreanDayKey(value) === koreanDayKey(now)) {
    const minutes = Math.max(
      0,
      Math.floor((now - date.getTime()) / 60000),
    );

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;

    return `${Math.floor(minutes / 60)}시간 전`;
  }

  const getYear = (target) =>
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(target);

  const sameYear = getYear(date) === getYear(current);

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...(sameYear ? {} : { year: 'numeric' }),
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return sameYear
    ? `${get('month')}월 ${get('day')}일`
    : `${get('year')}년 ${get('month')}월 ${get('day')}일`;
}

export function formatChatTime(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function getMessageSession(message, race) {
  const sessions = race.sessions ?? [];

  // 서버에서 메시지에 sessionId를 내려주면 우선 사용합니다.
  if (message.sessionId) {
    const session = sessions.find(
      (item) => item.id === message.sessionId,
    );

    if (session) return session;
  }

  // sessionId가 없으면 메시지 작성 시간을 경기 일정과 비교합니다.
  const timestamp = Date.parse(message.createdAt);

  return (
    sessions.find(
      (item) =>
        timestamp >= Date.parse(item.startsAt) &&
        timestamp < Date.parse(item.endsAt),
    ) ?? null
  );
}

export function formatSessionDate(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('month')}.${get('day')} ${get('weekday')} ${get('hour')}:${get('minute')}`;
}
