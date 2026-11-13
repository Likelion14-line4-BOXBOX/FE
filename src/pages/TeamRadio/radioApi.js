import { validateImage } from './radioModel.js';

export class RadioApiError extends Error {
  constructor(status, payload) {
    super(
      payload?.error?.message ??
        `요청에 실패했습니다. (${status})`,
    );

    this.name = 'RadioApiError';
    this.status = status;
    this.code = payload?.error?.code;
    this.details = payload?.error?.details ?? [];
    this.meta = payload?.meta;
  }
}

const pathId = (value) => encodeURIComponent(value);

function queryString(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      params.set(key, String(value));
    }
  });

  return params.size ? `?${params}` : '';
}

export function createRadioApi({
  baseUrl = '/api',
  getAccessToken = () => null,
  refreshAccessToken,
} = {}) {
  let refreshing = null;

  const url = (path) =>
    `${baseUrl.replace(/\/$/, '')}${path}`;

  async function authorizedFetch(
    path,
    options = {},
    retry = true,
  ) {
    const token = getAccessToken();

    const response = await fetch(url(path), {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    });

    if (
      response.status === 401 &&
      retry &&
      token &&
      refreshAccessToken &&
      !options.signal?.aborted
    ) {
      refreshing ??= Promise.resolve()
        .then(refreshAccessToken)
        .finally(() => {
          refreshing = null;
        });

      await refreshing;

      return authorizedFetch(
        path,
        options,
        false,
      );
    }

    return response;
  }

  async function request(
    method,
    path,
    { query, body, signal } = {},
  ) {
    const isForm =
      typeof FormData !== 'undefined' &&
      body instanceof FormData;

    const response = await authorizedFetch(
      `${path}${queryString(query)}`,
      {
        method,
        signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !isForm
            ? {
                'Content-Type': 'application/json',
              }
            : {}),
        },
        ...(body !== undefined
          ? {
              body: isForm
                ? body
                : JSON.stringify(body),
            }
          : {}),
      },
    );

    if (response.status === 204) {
      return undefined;
    }

    const payload = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new RadioApiError(
        response.status,
        payload,
      );
    }

    if (!payload) {
      throw new Error(
        '서버 JSON 응답을 읽을 수 없습니다.',
      );
    }

    return payload;
  }

  const get = (path, query, signal) =>
    request('GET', path, { query, signal });

  const put = (path) => request('PUT', path);
  const del = (path) => request('DELETE', path);

  return {
    // TR01
    getBoards: (query = {}, signal) =>
      get('/boards', query, signal),

    // TR02
    getTags: (boardId, signal) =>
      get(
        `/boards/${pathId(boardId)}/tags`,
        undefined,
        signal,
      ),

    // TR03
    getPosts: (boardId, query = {}, signal) =>
      get(
        `/boards/${pathId(boardId)}/posts`,
        query,
        signal,
      ),

    // TR04
    getPost: (postId, signal) =>
      get(
        `/posts/${pathId(postId)}`,
        undefined,
        signal,
      ),

    // TR05
    createPost: (boardId, body) =>
      request(
        'POST',
        `/boards/${pathId(boardId)}/posts`,
        { body },
      ),

    // TR06
    updatePost: (postId, body) =>
      request(
        'PATCH',
        `/posts/${pathId(postId)}`,
        { body },
      ),

    // TR07
    deletePost: (postId) =>
      del(`/posts/${pathId(postId)}`),

    // TR08
    getComments: (postId, query = {}, signal) =>
      get(
        `/posts/${pathId(postId)}/comments`,
        query,
        signal,
      ),

    // TR09
    createComment: (postId, body) =>
      request(
        'POST',
        `/posts/${pathId(postId)}/comments`,
        { body },
      ),

    // TR10
    updateComment: (commentId, content) =>
      request(
        'PATCH',
        `/comments/${pathId(commentId)}`,
        { body: { content } },
      ),

    // TR11
    deleteComment: (commentId) =>
      del(`/comments/${pathId(commentId)}`),

    // TR12
    likePost: (postId) =>
      put(`/posts/${pathId(postId)}/like`),

    // TR13
    unlikePost: (postId) =>
      del(`/posts/${pathId(postId)}/like`),

    // TR14
    bookmarkPost: (postId) =>
      put(`/posts/${pathId(postId)}/bookmark`),

    // TR15
    unbookmarkPost: (postId) =>
      del(`/posts/${pathId(postId)}/bookmark`),

    // TR16
    report: (body) =>
      request('POST', '/reports', { body }),

    // TR17
    getRooms: (query = {}, signal) =>
      get('/chat-rooms', query, signal),

    // TR18
    getRoom: (roomId, signal) =>
      get(
        `/chat-rooms/${pathId(roomId)}`,
        undefined,
        signal,
      ),

    // TR19
    getMessages: (roomId, query = {}, signal) =>
      get(
        `/chat-rooms/${pathId(roomId)}/messages`,
        query,
        signal,
      ),

    // TR20
    sendMessage: (roomId, body) =>
      request(
        'POST',
        `/chat-rooms/${pathId(roomId)}/messages`,
        { body },
      ),

    // TR21
    subscribeRoom: (roomId, options) =>
      subscribeSse(
        (headers, signal) =>
          authorizedFetch(
            `/chat-rooms/${pathId(roomId)}/events`,
            { headers, signal },
          ),
        options,
      ),

    // TR22
    searchPosts: (query = {}, signal) =>
      get('/posts', query, signal),

    // TR23
    likeComment: (commentId) =>
      put(`/comments/${pathId(commentId)}/like`),

    // TR24
    unlikeComment: (commentId) =>
      del(`/comments/${pathId(commentId)}/like`),

    // TR25
    deleteMessage: (roomId, messageId) =>
      del(
        `/chat-rooms/${pathId(roomId)}/messages/${pathId(messageId)}`,
      ),

    // CM04
    getReferenceData: (signal) =>
      get('/reference-data', undefined, signal),

    // CM09
    uploadImage: (file) => {
      validateImage(file);

      const body = new FormData();
      body.append('file', file);
      body.append('purpose', 'POST_IMAGE');

      // multipart boundary는 브라우저에서 설정합니다.
      return request('POST', '/media', { body });
    },
  };
}

// SSE는 공통 JSON envelope를 사용하지 않습니다.
export function parseSseFrame(frame) {
  let id;
  let event = 'message';
  const lines = [];

  for (const line of frame.split(/\r\n|\n|\r/)) {
    if (!line || line.startsWith(':')) continue;

    const colon = line.indexOf(':');
    const field =
      colon < 0 ? line : line.slice(0, colon);
    const value =
      colon < 0
        ? ''
        : line.slice(colon + 1).replace(/^ /, '');

    if (field === 'id') id = value;
    if (field === 'event') event = value;
    if (field === 'data') lines.push(value);
  }

  return lines.length
    ? {
        id,
        event,
        data: JSON.parse(lines.join('\n')),
      }
    : null;
}

// EventSource 대신 fetch를 사용하여
// Authorization 및 Last-Event-ID 헤더를 전달합니다.
export function subscribeSse(
  connect,
  {
    lastEventId,
    onEvent = () => {},
    onError = () => {},
    retryMs = 1500,
  } = {},
) {
  const controller = new AbortController();
  const seen = new Set();

  let cursor = lastEventId;
  let timer;

  function stop() {
    controller.abort();
    clearTimeout(timer);
  }

  async function run() {
    while (!controller.signal.aborted) {
      let reader;

      try {
        const response = await connect(
          {
            Accept: 'text/event-stream',
            ...(cursor
              ? { 'Last-Event-ID': cursor }
              : {}),
          },
          controller.signal,
        );

        if (!response.ok) {
          const payload = await response
            .json()
            .catch(() => null);

          throw new RadioApiError(
            response.status,
            payload,
          );
        }

        if (
          !response.headers
            .get('Content-Type')
            ?.includes('text/event-stream') ||
          !response.body
        ) {
          throw new Error(
            'SSE 응답 형식을 확인해주세요.',
          );
        }

        reader = response.body.getReader();

        const decoder = new TextDecoder();
        let buffer = '';

        while (!controller.signal.aborted) {
          const { value, done } =
            await reader.read();

          if (done) break;

          buffer += decoder.decode(value, {
            stream: true,
          });

          let match;

          while (
            !controller.signal.aborted &&
            (match = /\r\n\r\n|\n\n|\r\r/.exec(buffer))
          ) {
            const frame = buffer.slice(
              0,
              match.index,
            );

            buffer = buffer.slice(
              match.index + match[0].length,
            );

            const parsed = parseSseFrame(frame);
            if (!parsed) continue;

            const eventId =
              parsed.id ?? parsed.data.eventId;

            if (
              eventId &&
              seen.has(eventId)
            ) {
              continue;
            }

            onEvent({
              event: parsed.event,
              ...parsed.data,
            });

            if (eventId) {
              cursor = eventId;
              seen.add(eventId);

              if (seen.size > 1000) {
                seen.delete(
                  seen.values().next().value,
                );
              }
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        onError(error);

        if (
          error instanceof RadioApiError &&
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

      if (controller.signal.aborted) return;

      await new Promise((resolve) => {
        const finish = () => {
          clearTimeout(timer);

          controller.signal.removeEventListener(
            'abort',
            finish,
          );

          resolve();
        };

        timer = setTimeout(finish, retryMs);

        controller.signal.addEventListener(
          'abort',
          finish,
          { once: true },
        );
      });
    }
  }

  void run();
  return stop;
}