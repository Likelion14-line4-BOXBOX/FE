import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  boards,
  teams,
  races,
  initialPosts,
  initialMessages,
} from './radioData';
import s from './TeamRadio.module.scss';

const assets = import.meta.glob(
  '../../assets/images/teamradio/*.{svg,png,jpg,jpeg,webp}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

function MemberIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3H4Z" />
    </svg>
  );
}

function Asset({ name, fallback, className = '', hoverName }) {
  const src = assets[`../../assets/images/teamradio/${name}.svg`];

  const hoverSrc = hoverName
    ? assets[`../../assets/images/teamradio/${hoverName}.svg`]
    : null;

  if (src && hoverSrc) {
    return (
      <span className={s.teamArtwork}>
        <img
          className={s.normalAsset}
          src={src}
          alt={fallback}
        />
        <img
          className={s.hoverAsset}
          src={hoverSrc}
          alt=""
          aria-hidden="true"
        />
      </span>
    );
  }

  return src ? (
    <img className={className} src={src} alt={fallback} />
  ) : (
    <span className={className}>{fallback}</span>
  );
}

function Modal({ children, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-label="팀 라디오 알림"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className={s.modalClose}
        aria-label="팝업 닫기"
        onClick={onClose}
      >
        ×
      </button>
      {children}
    </dialog>
  );
}

export default function TeamRadio({ liveStatus = 'open' }) { //입장 전: scheduled, 입장: open
  const [params, setParams] = useSearchParams();

  const view = params.get('view') || 'home';
  const tab = params.get('tab') === 'chat' ? 'chat' : 'board';

  const board =
    boards.find((item) => item.id === params.get('board')) ||
    boards[0];

  const bannerSrc = board.banner
    ? assets[`../../assets/images/teamradio/${board.banner}`]
    : null;

  const race =
    races.find((item) => item.id === params.get('race')) ||
    races[0];

  const [posts, setPosts] = useState(initialPosts);
  const post = posts.find((item) => item.id === params.get('post'));

  const [tag, setTag] = useState('전체');
  const [sort, setSort] = useState('latest');
  const [period, setPeriod] = useState('all');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState(['공구', '루이스', '같이']);

  const [draft, setDraft] = useState({
    title: '',
    body: '',
    tag: '전체',
    images: [],
  });

  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [messages, setMessages] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('욕설, 비하');
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState('');

  const composerRef = useRef(null);
  const pageRef = useRef(null);
  const chatEndRef = useRef(null);

  const activeRace = { ...races[0], status: liveStatus };
  const chatOpen = race.id === races[0].id && liveStatus === 'open';
  const chatScheduled =
    race.id === races[0].id && liveStatus !== 'open';

  const chatMessages = messages[race.id] || initialMessages;
  const focused = ['post', 'write', 'search', 'chat'].includes(view);

  useEffect(() => {
    pageRef.current?.closest('main')?.scrollTo(0, 0);
  }, [view, params]);

  function go(nextView, extra = {}) {
    setMenu(null);
    setError('');
    setInput('');
    setReplyTo(null);
    setEditingMessage(null);
    setTag('전체');
    setSort('latest');
    setPeriod('all');
    setQuery('');

    setParams(
      new URLSearchParams({
        view: nextView,
        ...extra,
      }),
    );
  }

  function openBoard(item) {
    go('board', { board: item.id });
  }

  function openPost(item) {
    go('post', {
      board: item.boardId,
      post: item.id,
    });
  }

  function backToBoard() {
    go('board', { board: board.id });
  }

  function updatePost(values) {
    setPosts((previous) =>
      previous.map((item) =>
        item.id === post.id ? { ...item, ...values } : item,
      ),
    );
  }

  function beginWrite(edit = false) {
    setDraft(
      edit
        ? {
            title: post.title,
            body: post.body,
            tag: post.tag,
            images: post.images,
          }
        : {
            title: '',
            body: '',
            tag: '전체',
            images: [],
          },
    );

    go('write', {
      board: board.id,
      ...(edit ? { post: post.id } : {}),
    });
  }

  function publish(event) {
    event.preventDefault();

    if (!draft.title.trim() || !draft.body.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    const values = {
      ...draft,
      title: draft.title.trim(),
      body: draft.body.trim(),
    };

    if (post?.mine) {
      updatePost(values);
    } else {
      setPosts((previous) => [
        {
          ...values,
          id: crypto.randomUUID(),
          boardId: board.id,
          author: '나',
          mine: true,
          likes: 0,
          liked: false,
          saved: false,
          comments: [],
          date: '방금',
          createdAt: Date.now(),
        },
        ...previous,
      ]);
    }

    backToBoard();
  }

  async function attach(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (draft.images.length + files.length > 5) {
      setError('사진은 최대 5장까지 첨부할 수 있어요.');
      return;
    }

    if (
      files.some(
        (file) =>
          !/^image\/(jpeg|png|webp|gif)$/.test(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setError('5MB 이하의 JPG, PNG, WEBP, GIF 사진을 선택해주세요.');
      return;
    }

    try {
      const images = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => resolve(reader.result);
              reader.onerror = () =>
                reject(new Error('사진을 읽지 못했어요.'));

              reader.readAsDataURL(file);
            }),
        ),
      );

      setDraft((previous) => ({
        ...previous,
        images: [...previous.images, ...images].slice(0, 5),
      }));

      setError('');
    } catch {
      setError('사진을 읽지 못했어요. 다시 선택해주세요.');
    }
  }

  function addComment(event) {
    event.preventDefault();
    if (!input.trim()) return;

    updatePost({
      comments: [
        ...post.comments,
        {
          id: crypto.randomUUID(),
          text: input.trim(),
          mine: true,
          replyTo,
        },
      ],
    });

    setInput('');
    setReplyTo(null);
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!chatOpen || !input.trim()) return;

    setMessages((previous) => ({
      ...previous,
      [race.id]: editingMessage
        ? chatMessages.map((item) =>
            item.id === editingMessage
              ? { ...item, text: input.trim() }
              : item,
          )
        : [
            ...chatMessages,
            {
              id: crypto.randomUUID(),
              text: input.trim(),
              mine: true,
            },
          ],
    }));

    setInput('');
    setEditingMessage(null);

    requestAnimationFrame(() =>
      chatEndRef.current?.scrollIntoView({ block: 'end' }),
    );
  }

  function search(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setHistory((previous) =>
      [
        query.trim(),
        ...previous.filter((item) => item !== query.trim()),
      ].slice(0, 8),
    );

    setParams({
      view: 'search',
      board: board.id,
      q: query.trim(),
    });
  }

  function sortPosts(items) {
    return [...items].sort((a, b) =>
      sort === 'popular'
        ? b.likes - a.likes
        : b.createdAt - a.createdAt,
    );
  }

  const boardPosts = posts.filter(
    (item) => item.boardId === board.id,
  );

  const filteredPosts = sortPosts(
    boardPosts.filter(
      (item) => tag === '전체' || item.tag === tag,
    ),
  );

  const term = params.get('q') || '';

  const results = sortPosts(
    boardPosts.filter(
      (item) =>
        `${item.title} ${item.body} ${item.tag}`.includes(term) &&
        (period === 'all' ||
          Date.now() - item.createdAt <=
            Number(period) * 86400000),
    ),
  );

  function header(title, onBack, action) {
    return (
      <header className={s.header}>
        <button
          type="button"
          className={s.iconButton}
          aria-label="뒤로가기"
          onClick={onBack}
        >
          ‹
        </button>
        <h1>{title}</h1>
        {action || <span className={s.iconButton} />}
      </header>
    );
  }

  function postRows(items) {
    return items.length ? (
      items.map((item) => (
        <button
          type="button"
          className={s.postRow}
          key={item.id}
          onClick={() => openPost(item)}
        >
          <span className={s.redTag}>{item.tag}</span>
          <strong>{item.title}</strong>
          <span className={s.postMeta}>
            <span>
              {item.author} · {item.mine ? '방금' : '30분 전'}
            </span>
            <span>
              ▱ {item.comments.length} ♡ {item.likes}
            </span>
          </span>
        </button>
      ))
    ) : (
      <p className={s.empty}>게시글이 없어요.</p>
    );
  }

  function composer(onSubmit, label, placeholder) {
    return (
      <form className={s.composer} onSubmit={onSubmit}>
        <input
          ref={composerRef}
          aria-label={label}
          placeholder={placeholder}
          value={input}
          maxLength={1000}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="submit"
          aria-label={label + ' 전송'}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </form>
    );
  }

  function report() {
    setMenu(null);
    setReason('욕설, 비하');
    setOtherReason('');
    setModal({ type: 'report' });
  }

  return (
    <section
      ref={pageRef}
      className={`${s.page} ${
        view === 'home' || view === 'chat' ? s.gray : ''
      }`}
      data-radio-focus={focused ? 'true' : 'false'}
    >
      {view === 'home' && (
        <>
          <h1 className={s.logo}>
            <Asset name="Team Radio" fallback="Team Radio" />
          </h1>

          <div className={s.tabs} aria-label="팀 라디오 메뉴">
            {[
              ['board', '게시판'],
              ['chat', '채팅'],
            ].map(([id, name]) => (
              <button
                type="button"
                key={id}
                aria-pressed={tab === id}
                className={tab === id ? s.selected : ''}
                onClick={() => setParams({ tab: id })}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === 'board' ? (
            <>
              <h2>팀별 라디오</h2>

              <div className={s.grid}>
                {teams.map((team) => (
                  <button
                    type="button"
                    key={team.id}
                    className={s.teamCard}
                    style={{ '--team-color': team.color }}
                    aria-label={team.name + ' 게시판'}
                    onClick={() => openBoard(team)}
                  >
                    <Asset
                      name={team.asset}
                      hoverName={`${team.asset}_선택`}
                      fallback={team.name}
                    />
                  </button>
                ))}

                <button
                  type="button"
                  className={s.teamCard}
                  onClick={() => openBoard(boards.at(-1))}
                >
                  <Asset name="아카이브" fallback="아카이브" />
                </button>
              </div>

              <h2>사용자 라디오</h2>

              <div className={s.stack}>
                {boards
                  .filter((item) => item.description)
                  .map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={s.userBoard}
                      onClick={() => openBoard(item)}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                      <span>›</span>
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <article className={s.liveCard}>
                <div className={s.liveMeta}>
                  <Asset name="live" fallback="LIVE" className={s.liveBadge} />
                  {liveStatus === 'open' && (
                    <span className={s.memberCount}>
                      <MemberIcon />
                      100
                    </span>
                  )}
                  <small>
                    {liveStatus === 'open' ? '종료' : '오픈'}까지{' '}
                    {activeRace.remaining}
                  </small>
                </div>

                <h2>{activeRace.title}</h2>

                <button
                  type="button"
                  className={s.primary}
                  disabled={liveStatus !== 'open'}
                  onClick={() =>
                    go('chat', { race: activeRace.id })
                  }
                >
                  {liveStatus === 'open' ? '입장하기' : '오픈 전'}
                </button>
              </article>

              <h2>지난 채팅</h2>

              <div className={s.stack}>
                {races.slice(1).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={s.raceCard}
                    onClick={() => go('chat', { race: item.id })}
                  >
                    <span>
                      <small>Round {item.round}</small>
                      <strong>{item.title}</strong>
                    </span>
                    <span>10.31 - 11.1</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {view === 'board' && (
        <>
          {header(
            board.name,
            () => go('home'),
            <button
              type="button"
              className={s.iconButton}
              aria-label="게시판 검색"
              onClick={() =>
                go('search', { board: board.id })
              }
            >
              ⌕
            </button>,
          )}

          {board.color &&
            (bannerSrc ? (
              <img
                className={s.banner}
                src={bannerSrc}
                alt={board.name + ' 팀 소개'}
              />
            ) : (
              <div
                className={s.bannerPlaceholder}
                style={{ '--team-color': board.color }}
              >
                <strong>{board.name}</strong>
                <span>팀 이미지 준비 중</span>
              </div>
            ))}

          {board.description && boardPosts[0] && (
            <button
              type="button"
              className={s.pinned}
              onClick={() => openPost(boardPosts[0])}
            >
              <span className={s.redTag}>
                {boardPosts[0].tag}
              </span>
              <strong>{boardPosts[0].title}</strong>
            </button>
          )}

          {board.id !== 'archive' && (
            <div className={s.chips}>
              {board.tags.map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={tag === item}
                  className={tag === item ? s.selected : ''}
                  onClick={() => setTag(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          <div className={s.listMeta}>
            <span>글 {filteredPosts.length}개</span>
            <details className={s.sortDropdown}>
              <summary>
                {sort === 'popular' ? '인기순' : '최신순'}
                <span className={s.sortArrow} aria-hidden="true" />
              </summary>

              <div className={s.sortMenu}>
                {[
                  ['latest', '최신순'],
                  ['popular', '인기순'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={sort === value ? s.sortActive : ''}
                    aria-pressed={sort === value}
                    onClick={(event) => {
                      setSort(value);
                      event.currentTarget.closest('details').open = false;
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {postRows(filteredPosts)}

          {board.id !== 'archive' && (
            <button
              type="button"
              className={s.writeButton}
              onClick={() => beginWrite()}
            >
              ♢ 글쓰기
            </button>
          )}
        </>
      )}

      {view === 'search' && (
        <>
          <div className={s.searchHeader}>
            <button
              type="button"
              className={s.iconButton}
              aria-label="뒤로가기"
              onClick={backToBoard}
            >
              ‹
            </button>

            <form onSubmit={search}>
              <input
                aria-label="게시판 검색어"
                placeholder="제목 또는 내용, 태그 입력"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
              />
              <button type="submit" aria-label="검색">
                ⌕
              </button>
            </form>
          </div>

          {!term ? (
            <>
              <div className={s.listMeta}>
                <h2>검색 기록</h2>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                >
                  지우기
                </button>
              </div>

              <div className={s.chips}>
                {history.map((item) => (
                  <span key={item} className={s.historyItem}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        setParams({
                          view: 'search',
                          board: board.id,
                          q: item,
                        });
                      }}
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      aria-label={item + ' 검색 기록 삭제'}
                      onClick={() =>
                        setHistory((previous) =>
                          previous.filter(
                            (value) => value !== item,
                          ),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={s.listMeta}>
                <select
                  aria-label="검색 결과 정렬"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value)
                  }
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>

                <select
                  aria-label="검색 기간"
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value)
                  }
                >
                  <option value="all">전체 기간</option>
                  <option value="7">최근 1주</option>
                  <option value="30">최근 1개월</option>
                </select>

                <span>글 {results.length}개</span>
              </div>

              {postRows(results)}
            </>
          )}
        </>
      )}

      {view === 'write' && (
        <>
          {header(
            post?.mine ? '글 수정' : '글쓰기',
            backToBoard,
          )}

          <form className={s.editor} onSubmit={publish}>
            <label>
              게시판
              <input value={board.name} readOnly />
            </label>

            <fieldset>
              <legend>태그</legend>
              <div className={s.chips}>
                {board.tags.map((item) => (
                  <button
                    type="button"
                    key={item}
                    aria-pressed={draft.tag === item}
                    className={
                      draft.tag === item ? s.selected : ''
                    }
                    onClick={() =>
                      setDraft({ ...draft, tag: item })
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              제목 <small>{draft.title.length} / 20</small>
              <input
                maxLength={20}
                placeholder="제목을 입력하세요"
                required
                value={draft.title}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    title: event.target.value,
                  })
                }
              />
            </label>

            <label>
              내용
              <textarea
                placeholder="내용을 입력하세요"
                required
                value={draft.body}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    body: event.target.value,
                  })
                }
              />
            </label>

            <span>
              사진 <span className={s.muted}>최대 5장</span>
            </span>

            <div className={s.attachments}>
              <label className={s.upload}>
                ▣
                <small>{draft.images.length} / 5</small>
                <input
                  type="file"
                  aria-label="사진 첨부"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={attach}
                />
              </label>

              {draft.images.map((image, index) => (
                <div className={s.thumbnail} key={image}>
                  <img
                    src={image}
                    alt={`첨부 사진 ${index + 1}`}
                  />
                  <button
                    type="button"
                    aria-label={`첨부 사진 ${index + 1} 삭제`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        images: draft.images.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <p role="alert" className={s.redTag}>
                {error}
              </p>
            )}

            <button type="submit" className={s.primary}>
              {post?.mine ? '수정하기' : '등록하기'}
            </button>
          </form>
        </>
      )}

      {view === 'post' &&
        (post ? (
          <>
            {header(board.name, backToBoard)}

            <article className={s.article}>
              <div className={s.author}>
                <span className={s.avatar} />
                <span>
                  <strong>{post.author}</strong>
                  <small>{post.date}</small>
                </span>

                <button
                  type="button"
                  aria-label="게시글 메뉴"
                  className={s.more}
                  onClick={() =>
                    setMenu(menu ? null : 'post')
                  }
                >
                  ⋮
                </button>

                {menu === 'post' && (
                  <div className={s.menu}>
                    {post.mine ? (
                      <>
                        <button
                          type="button"
                          onClick={() => beginWrite(true)}
                        >
                          수정하기
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModal({ type: 'deletePost' })
                          }
                        >
                          삭제하기
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={report}
                      >
                        신고하기
                      </button>
                    )}
                  </div>
                )}
              </div>

              <span className={s.redTag}>{post.tag}</span>
              <h2>{post.title}</h2>
              <p className={s.body}>{post.body}</p>

              <div className={s.articleImages}>
                {post.images.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    aria-label={`첨부 사진 ${index + 1} 확대`}
                    onClick={() =>
                      setModal({ type: 'image', image })
                    }
                  >
                    <img
                      src={image}
                      alt={`첨부 사진 ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            </article>

            <div className={s.actions}>
              <button
                type="button"
                aria-label="게시글 좋아요"
                aria-pressed={post.liked}
                onClick={() =>
                  updatePost({
                    liked: !post.liked,
                    likes:
                      post.likes + (post.liked ? -1 : 1),
                  })
                }
              >
                {post.liked ? '♥' : '♡'} {post.likes}
              </button>

              <span>▱ {post.comments.length}</span>

              <button
                type="button"
                aria-label="게시글 저장"
                aria-pressed={post.saved}
                onClick={() =>
                  updatePost({ saved: !post.saved })
                }
              >
                {post.saved ? '▣' : '♧'}
              </button>
            </div>

            <div className={s.comments}>
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`${s.comment} ${
                    comment.replyTo ? s.reply : ''
                  }`}
                >
                  <span className={s.avatar} />

                  <div>
                    <strong>
                      {comment.mine ? '나' : '닉네임'}
                    </strong>{' '}
                    <small>10/30 12:14</small>
                    <p>{comment.text}</p>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(comment.id);
                        composerRef.current?.focus();
                      }}
                    >
                      ▱ 답글달기
                    </button>
                  </div>

                  <button
                    type="button"
                    className={s.more}
                    aria-label="댓글 메뉴"
                    onClick={() =>
                      comment.mine
                        ? setModal({
                            type: 'deleteComment',
                            id: comment.id,
                          })
                        : report()
                    }
                  >
                    ⋮
                  </button>
                </div>
              ))}
            </div>

            <div className={s.composerWrap}>
              {replyTo && (
                <button
                  type="button"
                  className={s.replyNotice}
                  onClick={() => setReplyTo(null)}
                >
                  답글 작성 중 · 취소 ×
                </button>
              )}

              {composer(
                addComment,
                '댓글',
                '메시지를 입력하세요',
              )}
            </div>
          </>
        ) : (
          <>
            {header('게시글', backToBoard)}
            <p className={s.empty}>
              게시글을 찾을 수 없어요.
            </p>
          </>
        ))}

      {view === 'chat' && (
        <div className={s.chatRoom}>
          {header(
            <>
              {race.title}
              <small className={s.chatLiveMeta}>
                {chatOpen ? (
                  <>
                    <Asset
                      name="live"
                      fallback="LIVE"
                      className={s.liveBadge}
                    />
                    <span>2일 3시간 40분 뒤 종료</span>
                  </>
                ) : (
                  '지난 채팅'
                )}
              </small>
            </>,
            () => go('home', { tab: 'chat' }),
            <span className={s.memberCount}>
              <MemberIcon />
              100
            </span>,
          )}

          <div className={s.chatNotice}>
            ♧{' '}
            {chatOpen
              ? '경기 시작 전후 1시간 운영 · 종료 후 지난 채팅방에서 열람만 가능'
              : chatScheduled
                ? '아직 오픈 전인 채팅방입니다.'
                : '종료된 채팅입니다. 조회만 가능합니다.'}
          </div>

          <div className={s.messages}>
            {chatMessages.map((message, index) => (
              <div key={message.id}>
                {index === 3 && (
                  <>
                    <div className={s.session}>
                      프리 프랙티스 2
                    </div>
                    <p className={s.day}>10.31 토 07:00</p>
                  </>
                )}

                <div
                  className={`${s.message} ${
                    message.mine ? s.mine : ''
                  }`}
                >
                  {!message.mine && (
                    <span className={s.avatar} />
                  )}

                  <div>
                    {!message.mine && <small>닉네임</small>}

                    <div className={s.bubbleRow}>
                      <button
                        type="button"
                        className={s.bubble}
                        aria-label={
                          (message.mine
                            ? '내 메시지: '
                            : '메시지: ') + message.text
                        }
                        onContextMenu={(event) => {
                          event.preventDefault();
                          if (chatOpen) setMenu(message.id);
                        }}
                        onClick={() =>
                          chatOpen &&
                          setMenu(
                            menu === message.id
                              ? null
                              : message.id,
                          )
                        }
                      >
                        {message.text}
                      </button>
                      <small>10:20</small>
                    </div>

                    {menu === message.id && chatOpen && (
                      <div className={s.messageMenu}>
                        {message.mine ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(message.id);
                                setInput(message.text);
                                setMenu(null);
                                composerRef.current?.focus();
                              }}
                            >
                              수정하기
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'deleteMessage',
                                  id: message.id,
                                })
                              }
                            >
                              삭제하기
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={report}
                          >
                            신고하기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          {chatOpen ? (
            <div className={s.composerWrap}>
              {editingMessage && (
                <button
                  type="button"
                  className={s.replyNotice}
                  onClick={() => {
                    setEditingMessage(null);
                    setInput('');
                  }}
                >
                  메시지 수정 중 · 취소 ×
                </button>
              )}

              {composer(
                sendMessage,
                '채팅',
                '메시지를 입력해주세요',
              )}
            </div>
          ) : (
            <p className={s.chatEnded}>
              {chatScheduled
                ? '아직 채팅방이 열리지 않았어요.'
                : '라이브 채팅이 종료되었습니다.'}
            </p>
          )}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal.type === 'image' ? (
            <img
              className={s.fullImage}
              src={modal.image}
              alt="첨부 사진 확대"
            />
          ) : modal.type === 'report' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setModal({ type: 'reported' });
              }}
            >
              <h2>신고 사유를 선택해 주세요.</h2>

              <fieldset className={s.reasons}>
                <legend className={s.srOnly}>
                  신고 사유
                </legend>

                {[
                  '욕설, 비하',
                  '상업적 광고',
                  '선정적인 내용',
                  '낚시, 도배',
                  '기타',
                ].map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name="reason"
                      value={item}
                      checked={reason === item}
                      onChange={() => setReason(item)}
                    />
                    {item}
                  </label>
                ))}

                {reason === '기타' && (
                  <input
                    aria-label="기타 신고 사유"
                    placeholder="직접 입력"
                    required
                    value={otherReason}
                    onChange={(event) =>
                      setOtherReason(event.target.value)
                    }
                  />
                )}
              </fieldset>

              <button
                type="submit"
                className={s.darkButton}
              >
                신고하기
              </button>
            </form>
          ) : modal.type === 'reported' ? (
            <>
              <h2>🚨 신고 완료</h2>
              <p className={s.muted}>
                신고 화면 확인이 완료되었습니다.
              </p>
              <button
                type="button"
                className={s.darkButton}
                onClick={() => setModal(null)}
              >
                닫기
              </button>
            </>
          ) : (
            <>
              <h2>
                {modal.type === 'deletePost'
                  ? '이 글을 삭제할까요?'
                  : '삭제할까요?'}
              </h2>

              <p className={s.muted}>
                삭제된 내용은 복구할 수 없습니다.
              </p>

              <div className={s.modalActions}>
                <button
                  type="button"
                  className={s.darkButton}
                  onClick={() => setModal(null)}
                >
                  뒤로가기
                </button>

                <button
                  type="button"
                  className={s.primary}
                  onClick={() => {
                    if (modal.type === 'deletePost') {
                      setPosts((previous) =>
                        previous.filter(
                          (item) => item.id !== post.id,
                        ),
                      );
                      backToBoard();
                    }

                    if (modal.type === 'deleteComment') {
                      updatePost({
                        comments: post.comments.filter(
                          (item) =>
                            item.id !== modal.id &&
                            item.replyTo !== modal.id,
                        ),
                      });
                    }

                    if (
                      modal.type === 'deleteMessage' &&
                      chatOpen
                    ) {
                      setMessages((previous) => ({
                        ...previous,
                        [race.id]: chatMessages.filter(
                          (item) => item.id !== modal.id,
                        ),
                      }));
                    }

                    setModal(null);
                    setMenu(null);
                  }}
                >
                  삭제하기
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}