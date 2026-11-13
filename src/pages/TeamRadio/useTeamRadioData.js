import { useState } from 'react';
import {
  boards as initialBoards,
  teams,
  races as initialRaces,
  initialPosts,
  initialMessages,
} from './radioData';
import {
  ALL_TAG,
  mapPost,
  mapComment,
  mapMessage,
  mapRoom,
  sortPosts,
  toPostBody,
  toReportBody,
  validateImage,
} from './radioModel';

export const MOCK_USER = {
  userId: 'mock-me',
  nickname: '나',
  avatarAssetId: '',
};

const profile = (mine, author) =>
  mine
    ? MOCK_USER
    : {
        userId: 'mock-other',
        nickname:
          typeof author === 'string' ? author : '닉네임',
        avatarAssetId: '',
      };

const iso = (value) => {
  const date = new Date(value ?? Date.now());

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

// 기존 임시 데이터를 API 명세 형태로 변환합니다.
// mock-* ID는 데모용이며 실제 서버에 보내면 안 됩니다.
function makeBoards() {
  return initialBoards.map((item, index) => {
    const type =
      item.type ??
      (item.id === 'archive'
        ? 'ARCHIVE'
        : teams.some((team) => team.id === item.id)
          ? 'TEAM'
          : /입문|초보/.test(item.name)
            ? 'BEGINNER'
            : 'FREE');

    return {
      ...item,
      boardId: String(item.id),
      id: String(item.id),
      type,
      teamId:
        type === 'TEAM'
          ? String(item.teamId ?? item.id)
          : null,
      displayOrder: item.displayOrder ?? index,
      isMyTeam: null,
      tagOptions: [
        ALL_TAG,
        ...(item.tags ?? [])
          .filter((name) => name !== '전체')
          .map((name, tagIndex) => ({
            tagId: `mock-${item.id}-${tagIndex}`,
            name,
            isActive: true,
            group: 'TOPIC',
            displayOrder: tagIndex,
          })),
      ],
    };
  });
}

function makePost(item, boards) {
  const board = boards.find(
    (entry) => entry.id === String(item.boardId),
  );

  const tag = board?.tagOptions.find(
    (entry) => entry.name === item.tag && entry.tagId,
  );

  const createdAt = iso(item.createdAt);

  return {
    postId: String(item.id),
    boardId: String(item.boardId),
    title: item.title,
    preview: item.body ?? '',
    content: item.body ?? '',
    author: profile(item.mine, item.author),
    tags: tag
      ? [{ tagId: tag.tagId, name: tag.name }]
      : [],
    thumbnailUrl: item.images?.[0] ?? null,
    likeCount: item.likeCount ?? item.likes ?? 0,
    commentCount:
      item.commentCount ??
      item.comments?.filter(
        (entry) => !entry.isDeleted,
      ).length ??
      0,
    bookmarkCount: 0,
    viewCount: 0,
    createdAt,
    updatedAt: createdAt,
    likedByMe: item.liked ?? false,
    bookmarkedByMe: item.saved ?? false,
    media: (item.images ?? []).map((url, index) => ({
      mediaId: `mock-${item.id}-media-${index}`,
      url,
      width: 0,
      height: 0,
    })),
    canEdit: Boolean(item.mine),
    canDelete: Boolean(item.mine),
  };
}

function makeComment(item, postId) {
  return {
    commentId: String(item.id),
    postId,
    parentId: item.replyTo ?? null,
    author: item.isDeleted
      ? null
      : profile(item.mine, item.author),
    content: item.isDeleted ? null : item.text,
    isDeleted: item.isDeleted ?? false,
    likeCount: item.likeCount ?? 0,
    likedByMe: item.likedByMe ?? false,
    replyCount: 0,
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.createdAt),
  };
}

export default function useTeamRadioData({
  currentUser = MOCK_USER,
  liveStatus = 'open',
} = {}) {
  const [boardSettings] = useState(makeBoards);

  const [postDtos, setPostDtos] = useState(() =>
    initialPosts.map((item) =>
      makePost(item, boardSettings),
    ),
  );

  const [commentDtos, setCommentDtos] = useState(() =>
    Object.fromEntries(
      initialPosts.map((item) => [
        String(item.id),
        (item.comments ?? []).map((entry) =>
          makeComment(entry, String(item.id)),
        ),
      ]),
    ),
  );

  const [messageDtos, setMessageDtos] = useState({});
  const [uploadedMedia, setUploadedMedia] = useState({});
  const [reported, setReported] = useState([]);

  const userId = currentUser?.userId;
  const isAuthenticated = Boolean(userId);

  function requireLogin() {
    if (!isAuthenticated) {
      throw new Error('로그인 후 이용해주세요.');
    }
  }

  function mapView(dto) {
    const view = mapPost(
      {
        ...dto,
        canEdit: dto.author?.userId === userId,
        canDelete: dto.author?.userId === userId,
        likedByMe: isAuthenticated
          ? dto.likedByMe
          : null,
        bookmarkedByMe: isAuthenticated
          ? dto.bookmarkedByMe
          : null,
      },
      userId,
    );

    view.comments = (commentDtos[dto.postId] ?? []).map(
      (item) =>
        mapComment(
          {
            ...item,
            likedByMe: isAuthenticated
              ? item.likedByMe
              : null,
            replyCount: (
              commentDtos[dto.postId] ?? []
            ).filter(
              (entry) =>
                entry.parentId === item.commentId &&
                !entry.isDeleted,
            ).length,
          },
          userId,
        ),
    );

    return view;
  }

  const posts = postDtos.map(mapView);

  const boards = boardSettings.map((item) => ({
    ...item,
    postCount: postDtos.filter(
      (entry) => entry.boardId === item.id,
    ).length,
  }));

  const races = initialRaces.map((item, index) =>
    mapRoom({
      ...item,
      roomId: String(item.roomId ?? item.id),
      raceId: String(item.raceId ?? item.id),
      raceName: item.raceName ?? item.title,
      roundNumber: item.roundNumber ?? item.round,
      status:
        index === 0
          ? liveStatus === 'open'
            ? 'LIVE'
            : 'SCHEDULED'
          : 'ARCHIVED',
      canSendMessage:
        index === 0 &&
        liveStatus === 'open' &&
        isAuthenticated,
      onlineCount: item.onlineCount ?? 100,
      participantCount: item.participantCount ?? 100,
    }),
  );

  function updatePost(id, values) {
    requireLogin();

    const target = postDtos.find(
      (item) => item.postId === id,
    );

    if (target?.author?.userId !== userId) {
      throw new Error('본인 글만 수정할 수 있어요.');
    }

    const body = toPostBody(values);

    const option = boards
      .find((board) => board.id === target.boardId)
      ?.tagOptions.find(
        (item) => item.tagId === body.tagIds[0],
      );

    setPostDtos((previous) =>
      previous.map((item) =>
        item.postId === id
          ? {
              ...item,
              ...body,
              tags: option
                ? [{
                    tagId: option.tagId,
                    name: option.name,
                  }]
                : [],
              media: values.images,
              thumbnailUrl:
                values.images[0]?.url ?? null,
              preview: body.content.slice(0, 100),
              updatedAt: iso(),
            }
          : item,
      ),
    );
  }

  function createPost(boardId, values) {
    requireLogin();

    const body = toPostBody(values);

    const option = boards
      .find((item) => item.id === boardId)
      ?.tagOptions.find(
        (item) => item.tagId === body.tagIds[0],
      );

    const dto = {
      postId: crypto.randomUUID(),
      boardId,
      title: body.title,
      content: body.content,
      preview: body.content.slice(0, 100),
      author: currentUser,
      tags: option
        ? [{
            tagId: option.tagId,
            name: option.name,
          }]
        : [],
      media: values.images,
      thumbnailUrl: values.images[0]?.url ?? null,
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      likedByMe: false,
      bookmarkedByMe: false,
      createdAt: iso(),
      updatedAt: iso(),
      canEdit: true,
      canDelete: true,
    };

    setPostDtos((previous) => [dto, ...previous]);
    return dto;
  }

  function deletePost(id) {
    requireLogin();

    const target = postDtos.find(
      (item) => item.postId === id,
    );

    if (target?.author?.userId !== userId) {
      throw new Error('본인 글만 삭제할 수 있어요.');
    }

    setPostDtos((previous) =>
      previous.filter((item) => item.postId !== id),
    );
  }

  function addComment(postId, { text, replyTo }) {
    requireLogin();

    const content = text.trim();

    if (!content || content.length > 1000) {
      throw new Error(
        '댓글은 1~1000자로 입력해주세요.',
      );
    }

    if (
      replyTo &&
      !(commentDtos[postId] ?? []).some(
        (item) =>
          item.commentId === replyTo &&
          !item.isDeleted &&
          item.parentId === null,
      )
    ) {
      throw new Error(
        '삭제되지 않은 최상위 댓글에만 답글을 달 수 있어요.',
      );
    }

    const comment = {
      commentId: crypto.randomUUID(),
      postId,
      parentId: replyTo ?? null,
      author: currentUser,
      content,
      isDeleted: false,
      likeCount: 0,
      likedByMe: false,
      replyCount: 0,
      createdAt: iso(),
      updatedAt: iso(),
    };

    setCommentDtos((previous) => ({
      ...previous,
      [postId]: [
        ...(previous[postId] ?? []),
        comment,
      ],
    }));

    setPostDtos((previous) =>
      previous.map((item) =>
        item.postId === postId
          ? {
              ...item,
              commentCount: item.commentCount + 1,
            }
          : item,
      ),
    );
  }

  function updateComment(postId, id, text) {
    requireLogin();

    if (!text.trim() || text.trim().length > 1000) {
      throw new Error(
        '댓글은 1~1000자로 입력해주세요.',
      );
    }

    if (
      !(commentDtos[postId] ?? []).some(
        (item) =>
          item.commentId === id &&
          !item.isDeleted &&
          item.author?.userId === userId,
      )
    ) {
      throw new Error(
        '본인 댓글만 수정할 수 있어요.',
      );
    }

    setCommentDtos((previous) => ({
      ...previous,
      [postId]: previous[postId].map((item) =>
        item.commentId === id
          ? {
              ...item,
              content: text.trim(),
              updatedAt: iso(),
            }
          : item,
      ),
    }));
  }

  function deleteComment(postId, id) {
    requireLogin();

    const target = (commentDtos[postId] ?? []).find(
      (item) => item.commentId === id,
    );

    if (
      !target ||
      target.isDeleted ||
      target.author?.userId !== userId
    ) {
      throw new Error(
        '본인 댓글만 삭제할 수 있어요.',
      );
    }

    setCommentDtos((previous) => {
      const current = previous[postId] ?? [];

      const hasReplies = current.some(
        (item) => item.parentId === id,
      );

      let next = hasReplies
        ? current.map((item) =>
            item.commentId === id
              ? {
                  ...item,
                  isDeleted: true,
                  author: null,
                  content: null,
                  likedByMe: null,
                  likeCount: 0,
                }
              : item,
          )
        : current.filter(
            (item) => item.commentId !== id,
          );

      next = next.filter(
        (item) =>
          !item.isDeleted ||
          next.some(
            (reply) =>
              reply.parentId === item.commentId,
          ),
      );

      return {
        ...previous,
        [postId]: next,
      };
    });

    setPostDtos((previous) =>
      previous.map((item) =>
        item.postId === postId
          ? {
              ...item,
              commentCount: Math.max(
                0,
                item.commentCount - 1,
              ),
            }
          : item,
      ),
    );
  }

  function toggleLike(id) {
    requireLogin();

    setPostDtos((previous) =>
      previous.map((item) =>
        item.postId === id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount: Math.max(
                0,
                item.likeCount +
                  (item.likedByMe ? -1 : 1),
              ),
            }
          : item,
      ),
    );
  }

  function toggleSave(id) {
    requireLogin();

    setPostDtos((previous) =>
      previous.map((item) =>
        item.postId === id
          ? {
              ...item,
              bookmarkedByMe: !item.bookmarkedByMe,
              bookmarkCount: Math.max(
                0,
                item.bookmarkCount +
                  (item.bookmarkedByMe ? -1 : 1),
              ),
            }
          : item,
      ),
    );
  }

  function toggleCommentLike(postId, id) {
    requireLogin();

    setCommentDtos((previous) => ({
      ...previous,
      [postId]: (previous[postId] ?? []).map(
        (item) =>
          item.commentId === id && !item.isDeleted
            ? {
                ...item,
                likedByMe: !item.likedByMe,
                likeCount: Math.max(
                  0,
                  item.likeCount +
                    (item.likedByMe ? -1 : 1),
                ),
              }
            : item,
      ),
    }));
  }

  function getMessages(roomId) {
    const fallback = initialMessages.map((item) => ({
      messageId: String(item.id),
      clientMessageId: String(item.id),
      roomId,
      sender: profile(item.mine, item.author),
      content: item.text,
      createdAt: iso(item.createdAt),
      isDeleted: false,
      canDelete: Boolean(item.mine),
    }));

    return (messageDtos[roomId] ?? fallback).map(
      (item) =>
        mapMessage(
          {
            ...item,
            canDelete:
              item.sender?.userId === userId,
          },
          userId,
        ),
    );
  }

  function sendMessage(
    roomId,
    { text, clientMessageId },
  ) {
    requireLogin();

    if (
      !races.find((item) => item.id === roomId)
        ?.canSendMessage
    ) {
      throw new Error(
        '현재 메시지를 전송할 수 없는 방입니다.',
      );
    }

    const content = text.trim();

    if (!content || content.length > 500) {
      throw new Error(
        '채팅은 1~500자로 입력해주세요.',
      );
    }

    const current = getMessages(roomId);

    if (
      current.some(
        (item) =>
          item.clientMessageId === clientMessageId,
      )
    ) {
      return;
    }

    const message = {
      messageId: crypto.randomUUID(),
      clientMessageId,
      roomId,
      sender: currentUser,
      content,
      createdAt: iso(),
      isDeleted: false,
      canDelete: true,
    };

    setMessageDtos((previous) => {
      const existing =
        previous[roomId] ??
        current.map(
          ({
            id,
            text,
            mine,
            nickname,
            date,
            ...item
          }) => item,
        );

      if (
        existing.some(
          (item) =>
            item.clientMessageId === clientMessageId,
        )
      ) {
        return previous;
      }

      return {
        ...previous,
        [roomId]: [...existing, message],
      };
    });
  }

  function deleteMessage(roomId, id) {
    requireLogin();

    if (
      !getMessages(roomId).some(
        (item) => item.id === id && item.canDelete,
      )
    ) {
      throw new Error(
        '본인 메시지만 삭제할 수 있어요.',
      );
    }

    setMessageDtos((previous) => ({
      ...previous,
      [roomId]: (
        previous[roomId] ?? getMessages(roomId)
      ).map((item) =>
        item.messageId === id
          ? {
              ...item,
              isDeleted: true,
              sender: null,
              content: null,
              canDelete: false,
            }
          : item,
      ),
    }));
  }

  async function uploadImages(files) {
    requireLogin();
    files.forEach(validateImage);

    // 현재는 미리보기용 목업 업로드입니다.
    // 실제 연동 시 CM09 uploadImage 응답으로 교체합니다.
    const media = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve({
                mediaId: `mock-${crypto.randomUUID()}`,
                url: reader.result,
                width: 0,
                height: 0,
                contentType: file.type,
                sizeBytes: file.size,
              });

            reader.onerror = () =>
              reject(
                new Error('사진을 읽지 못했어요.'),
              );

            reader.readAsDataURL(file);
          }),
      ),
    );

    setUploadedMedia((previous) => ({
      ...previous,
      ...Object.fromEntries(
        media.map((item) => [item.mediaId, item]),
      ),
    }));

    return media;
  }

  function report(target, reason, description) {
    requireLogin();

    const body = toReportBody(
      target,
      reason,
      description,
    );

    if (
      reported.some(
        (item) =>
          item.targetType === body.targetType &&
          item.targetId === body.targetId,
      )
    ) {
      throw new Error(
        '이미 신고한 콘텐츠입니다.',
      );
    }

    setReported((previous) => [...previous, body]);

    return {
      reportId: crypto.randomUUID(),
      status: 'RECEIVED',
    };
  }

  function getBoardPostPage(
    boardId,
    {
      tagId,
      sort = 'latest',
      q = '',
      period = 'all',
    } = {},
  ) {
    const board = boards.find(
      (item) => item.id === boardId,
    );

    const all = postDtos.filter(
      (item) => item.boardId === boardId,
    );

    const items = sortPosts(
      all.filter(
        (item) =>
          (!tagId ||
            item.tags.some(
              (tag) => tag.tagId === tagId,
            )) &&
          (!q ||
            `${item.title} ${item.content} ${item.tags
              .map((tag) => tag.name)
              .join(' ')}`.includes(q)) &&
          (period === 'all' ||
            Date.now() - Date.parse(item.createdAt) <=
              Number(period) * 86400000),
      ),
      sort,
    );

    // 데모 응답 생성용 인기 기준입니다.
    // 실제 연동에서는 TR03 data.popularPost를 그대로 사용합니다.
    const popular =
      board?.type === 'FREE' ||
      board?.type === 'BEGINNER'
        ? sortPosts(all, 'popular')[0]
        : null;

    return {
      items: items.map(mapView),
      nextCursor: null,
      hasNext: false,
      totalCount: items.length,
      popularPost: popular ? mapView(popular) : null,
    };
  }

  return {
    boards,
    teams,
    races,
    posts,
    isAuthenticated,
    currentUser,
    uploadedMedia,
    updatePost,
    createPost,
    deletePost,
    addComment,
    updateComment,
    deleteComment,
    toggleLike,
    toggleSave,
    toggleCommentLike,
    getMessages,
    sendMessage,
    deleteMessage,
    uploadImages,
    report,
    getBoardPostPage,
  };
}