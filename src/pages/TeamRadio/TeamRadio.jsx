import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useTeamRadioData, { MOCK_USER } from './useTeamRadioData';
import { formatKoreanTime, REPORT_REASONS, findTeamBoard } from './radioModel';
import s from './TeamRadio.module.scss';

const assets = import.meta.glob('../../assets/images/teamradio/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const SEARCH_SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

const SEARCH_PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: '1', label: '최근 1일' },
  { value: '7', label: '최근 1주' },
  { value: '30', label: '최근 1개월' },
  { value: '365', label: '최근 1년' },
];

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" />
      <path d="m17 17 5 5" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7L3 22V5.5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M12 21 3.5 12.5C-2 7 5.5-1 12 6c6.5-7 14 1 8.5 6.5Z" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.5h12v17l-6-4-6 4z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20V4M5 11l7-7 7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3v8a4 4 0 0 0 4 4h10M14 10l5 5-5 5" />
    </svg>
  );
}

function PostCounts({ post, className = '' }) {
  return (
    <span className={`${s.postCounts} ${className}`}>
      <span className={s.countItem} aria-label={`댓글 ${post.commentCount}개`}>
        <CommentIcon />
        {post.commentCount}
      </span>

      <span className={s.countItem} aria-label={`좋아요 ${post.likeCount}개`}>
        <HeartIcon />
        {post.likeCount}
      </span>
    </span>
  );
}

function MemberIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 4-6.5 16-3.8-7.1L3 10 20 4Z" />
    </svg>
  );
}

function Asset({ name, fallback, className = '', hoverName }) {
  const src = assets[`../../assets/images/teamradio/${name}.svg`];

  const hoverSrc = hoverName ? assets[`../../assets/images/teamradio/${hoverName}.svg`] : null;

  if (src && hoverSrc) {
    return (
      <span className={s.teamArtwork}>
        <img className={s.normalAsset} src={src} alt={fallback} />

        <img className={s.hoverAsset} src={hoverSrc} alt="" aria-hidden="true" />
      </span>
    );
  }

  return src ? (
    <img className={className} src={src} alt={fallback} />
  ) : (
    <span className={className}>{fallback}</span>
  );
}

function Modal({ children, onClose, variant = 'default' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${s.dialog} ${
        variant === 'image'
          ? s.imageDialog
          : variant === 'report'
            ? s.reportDialog
            : variant === 'reported'
              ? s.reportedDialog
              : s.deleteDialog
      }`}
      aria-label="팀 라디오 알림"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {variant === 'image' && (
        <button
          type="button"
          className={`${s.modalClose} ${s.imageModalClose}`}
          aria-label="팝업 닫기"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      )}

      {children}
    </dialog>
  );
}

function SearchDropdown({ label, value, options, onChange }) {
  const ref = useRef(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event) {
      const dropdown = ref.current;

      if (dropdown?.open && !dropdown.contains(event.target)) {
        dropdown.open = false;
      }
    }

    function onKeyDown(event) {
      const dropdown = ref.current;

      if (event.key === 'Escape' && dropdown?.open) {
        event.preventDefault();
        dropdown.open = false;
        dropdown.querySelector('summary')?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={`${s.sortDropdown} ${s.searchDropdown}`}
      onToggle={(event) => {
        const dropdown = event.currentTarget;
        if (!dropdown.open) return;

        dropdown
          .closest('[data-search-filters]')
          ?.querySelectorAll('details')
          .forEach((other) => {
            if (other !== dropdown) {
              other.open = false;
            }
          });
      }}
    >
      <summary aria-label={`${label}: ${selected.label}`}>
        {selected.label}
        <span className={s.sortArrow} aria-hidden="true" />
      </summary>

      <div className={s.sortMenu} role="group" aria-label={`${label} 옵션`}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={value === option.value ? s.sortActive : ''}
            aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);

              if (ref.current) {
                ref.current.open = false;
                ref.current.querySelector('summary')?.focus();
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  );
}

function ReportActions({ recipient, onSendMessage, onReport }) {
  return (
    <>
      <button
        type="button"
        disabled={!onSendMessage || !recipient?.userId}
        onClick={() => onSendMessage?.(recipient)}
      >
        쪽지 보내기
      </button>

      <button type="button" className={s.reportAction} onClick={onReport}>
        신고하기
      </button>
    </>
  );
}

function formatRemainingTime(target, now, fallback) {
  const timestamp = Date.parse(target);
  if (!Number.isFinite(timestamp)) return fallback || '시간 미정';
  const totalMinutes = Math.max(0, Math.ceil((timestamp - now) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [days > 0 && `${days}일`, (days > 0 || hours > 0) && `${hours}시간`, `${minutes}분`]
    .filter(Boolean)
    .join(' ');
}

export default function TeamRadio({ liveStatus = 'open', currentUser = MOCK_USER, onSendMessage }) {
  const [params, setParams] = useSearchParams();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const radio = useTeamRadioData({
    liveStatus,
    currentUser,
  });

  const { boards, teams, races, posts } = radio;

  const view = params.get('view') || 'home';
  const tab = params.get('tab') === 'chat' ? 'chat' : 'board';

  const board = boards.find((item) => item.id === params.get('board')) || boards[0];

  const bannerSrc = board.banner ? assets[`../../assets/images/teamradio/${board.banner}`] : null;

  const race = races.find((item) => item.id === params.get('race')) || races[0];

  const post = posts.find((item) => item.id === params.get('post'));

  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('latest');
  const [period, setPeriod] = useState('all');

  const [query, setQuery] = useState(() => params.get('q') || '');

  const [history, setHistory] = useState(['공구', '루이스', '같이']);

  const [draft, setDraft] = useState({
    title: '',
    body: '',
    tagId: null,
    images: [],
  });

  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyPrefix, setReplyPrefix] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageEdits, setMessageEdits] = useState({});

  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('ABUSE');
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState('');

  const composerRef = useRef(null);
  const pageRef = useRef(null);
  const searchReturnRef = useRef(null);
  const chatEndRef = useRef(null);

    useEffect(() => {
    if (view !== 'chat') return;

    const page = pageRef.current;
    if (!page) return;

    const content = page.closest('main.content') || page.parentElement;
    if (!content) return;

    const syncChatHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      const height = Math.min(
        874,
        content.clientHeight,
        viewportHeight,
      );

      page.style.setProperty('--chat-height', `${height}px`);
    };

    syncChatHeight();

    const observer = new ResizeObserver(syncChatHeight);
    observer.observe(content);

    window.addEventListener('resize', syncChatHeight);
    window.visualViewport?.addEventListener('resize', syncChatHeight);

    return () => {
      observer.disconnect();

      window.removeEventListener('resize', syncChatHeight);
      window.visualViewport?.removeEventListener('resize', syncChatHeight);
    };
  }, [view]);

  const activeRace =
    races.find((item) => item.status === 'LIVE') ??
    races.find((item) => item.status === 'SCHEDULED') ??
    races[0];

  const chatOpen = race.status === 'LIVE';
  const canSendMessage = race.canSendMessage === true;
  const chatScheduled = race.status === 'SCHEDULED';

  const chatMessages = radio.getMessages(race.id);

  const focused = ['post', 'write', 'search', 'chat'].includes(view);

  useEffect(() => {
    if (view === 'search') {
      setQuery(params.get('q') || '');
    }
  }, [view, params]);

  function go(nextView, extra = {}) {
    setMenu(null);
    setError('');
    setInput('');
    setReplyTo(null);
    setReplyPrefix('');
    setEditingComment(null);
    setTag(null);
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
    go('board', {
      board: item.id,
    });
  }

  function openTeamBoard(team) {
    const target = findTeamBoard(boards, String(team.teamId ?? team.id));

    if (target) {
      openBoard(target);
    } else {
      setError('팀 게시판을 찾을 수 없어요.');
    }
  }

  function openPost(item) {
    searchReturnRef.current =
      view === 'search'
        ? {
            params: params.toString(),
            sort,
            period,
          }
        : null;

    go('post', {
      board: item.boardId,
      post: item.id,
    });
  }

  function backFromPost() {
    const saved = searchReturnRef.current;

    if (!saved) {
      backToBoard();
      return;
    }

    setMenu(null);
    setError('');
    setInput('');
    setReplyTo(null);
    setReplyPrefix('');
    setEditingComment(null);

    setSort(saved.sort);
    setPeriod(saved.period);
    setParams(new URLSearchParams(saved.params));

    searchReturnRef.current = null;
  }

  function backToBoard() {
    go('board', {
      board: board.id,
    });
  }

  function requireLogin() {
    if (radio.isAuthenticated) return true;

    setError('로그인 후 이용해주세요.');
    return false;
  }

  function act(action) {
    try {
      action();
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }

  function beginWrite(edit = false) {
    if (!requireLogin()) return;

    setDraft(
      edit
        ? {
            title: post.title,
            body: post.body,
            tagId: post.tagId,
            images: post.media,
          }
        : {
            title: '',
            body: '',
            tagId: null,
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

    try {
      if (post?.canEdit) {
        radio.updatePost(post.id, draft);
      } else {
        radio.createPost(board.id, draft);
      }

      backToBoard();
    } catch (error) {
      setError(error.message);
    }
  }

  async function attach(event) {
    const files = Array.from(event.target.files || []);

    event.target.value = '';

    if (draft.images.length + files.length > 5) {
      setError('사진은 최대 5장까지 첨부할 수 있어요.');
      return;
    }

    try {
      const images = await radio.uploadImages(files);

      setDraft((previous) => ({
        ...previous,
        images: [...previous.images, ...images].slice(0, 5),
      }));

      setError('');
    } catch (error) {
      setError(error.message || '사진을 읽지 못했어요.');
    }
  }

  function beginReply(comment) {
    if (!requireLogin()) return;

    const parentId = comment.replyTo ?? comment.id;

    const parent = post.comments.find((item) => item.id === parentId);

    if (parent?.isDeleted) {
      setError('삭제된 댓글에는 답글을 달 수 없어요.');
      return;
    }

    const prefix = `@${comment.nickname} `;

    setMenu(null);
    setError('');
    setEditingComment(null);
    setReplyTo(parentId);
    setReplyPrefix(prefix);
    setInput(prefix);

    composerRef.current?.focus();
  }

  function changeComposerInput(event) {
    const value = event.target.value;
    setInput(value);

    if (replyPrefix && value !== replyPrefix.trimEnd() && !value.startsWith(replyPrefix)) {
      setReplyTo(null);
      setReplyPrefix('');
    }
  }

  function sendPrivateMessage(recipient) {
    if (!requireLogin() || !onSendMessage) {
      return;
    }

    setMenu(null);
    onSendMessage(recipient);
  }

  function addComment(event) {
    event.preventDefault();
    if (!input.trim()) return;

    if (replyPrefix && input.trim() === replyPrefix.trim()) {
      setError('답글 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingComment) {
        radio.updateComment(post.id, editingComment, input);
      } else {
        radio.addComment(post.id, {
          text: input.trim(),
          replyTo,
        });
      }

      setInput('');
      setReplyTo(null);
      setReplyPrefix('');
      setEditingComment(null);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }

  function sendMessage(event) {
    event.preventDefault();

    if (!canSendMessage || !input.trim()) {
      return;
    }

    try {
      if (editingMessage) {
        // 채팅 수정 API가 없어 현재 화면에서만 수정합니다.
        setMessageEdits((previous) => ({ ...previous, [editingMessage]: input.trim() }));
        setEditingMessage(null);
      } else {
        radio.sendMessage(race.id, {
          text: input.trim(),
          clientMessageId: crypto.randomUUID(),
        });
      }

      setInput('');
      setError('');

      requestAnimationFrame(() => {
        const messages = chatEndRef.current?.parentElement;
        if (messages) messages.scrollTop = messages.scrollHeight;
      });
    } catch (error) {
      setError(error.message);
    }
  }

  function search(event) {
    event.preventDefault();
    if (!query.trim()) return;

    if (query.trim().length > 100) {
      setError('검색어는 100자까지 입력해주세요.');
      return;
    }

    setHistory((previous) =>
      [query.trim(), ...previous.filter((item) => item !== query.trim())].slice(0, 8),
    );

    setParams({
      view: 'search',
      board: board.id,
      q: query.trim(),
    });
  }

  function report(targetType, targetId) {
    if (!requireLogin()) return;

    setMenu(null);
    setReason('ABUSE');
    setOtherReason('');

    setModal({
      type: 'report',
      targetType,
      targetId,
    });
  }

  function submitReport(event) {
    event.preventDefault();

    try {
      radio.report(
        {
          targetType: modal.targetType,
          targetId: modal.targetId,
        },
        reason,
        otherReason,
      );

      setModal({
        type: 'reported',
      });
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }

  const boardPage = radio.getBoardPostPage(board.id, {
    tagId: tag,
    sort,
  });

  const filteredPosts = boardPage.items;
  const popularPost = boardPage.popularPost;
  const term = params.get('q') || '';

  const searchPage = radio.getBoardPostPage(board.id, {
    q: term,
    sort,
    period,
  });

  const results = searchPage.items;

  function header(title, onBack, action) {
    return (
      <header className={s.header}>
        <button
          type="button"
          className={s.iconButton}
          aria-label={view === 'write' ? '글쓰기 닫기' : '뒤로가기'}
          onClick={onBack}
        >
          {view === 'write' ? <CloseIcon /> : '‹'}
        </button>

        <h1>{title}</h1>

        {action || <span className={s.iconButton} />}
      </header>
    );
  }

  function postRows(items) {
    return items.length ? (
      items.map((item) => (
        <button type="button" className={s.postRow} key={item.id} onClick={() => openPost(item)}>
          <span className={s.redTag}>{item.tag}</span>

          <strong>{item.title}</strong>

          <span className={s.postMeta}>
            <span>
              {item.author} · {formatKoreanTime(item.createdAt)}
            </span>

            <PostCounts post={item} />
          </span>
        </button>
      ))
    ) : (
      <p className={s.empty}>게시글이 없어요.</p>
    );
  }

  function renderCommentText(comment) {
    const text = comment.text ?? '';
    if (!comment.replyTo || !text.startsWith('@')) return text;

    // 공백이 포함된 닉네임도 가능한 긴 이름부터 확인합니다.
    const names = [
      ...new Set(
        [post?.author, ...(post?.comments ?? []).map((item) => item.nickname)].filter(Boolean),
      ),
    ].sort((a, b) => b.length - a.length);
    const name = names.find((nickname) => {
      const prefix = `@${nickname}`;
      return (
        text.startsWith(prefix) && (text.length === prefix.length || /\s/.test(text[prefix.length]))
      );
    });
    const mention = name ? `@${name}` : text.match(/^@\S+/)?.[0];
    if (!mention) return text;

    return (
      <>
        <span className={s.mention}>{mention}</span>
        {text.slice(mention.length)}
      </>
    );
  }

  function composer(onSubmit, label, placeholder) {
    const disabled = !radio.isAuthenticated || (label === '채팅' && !canSendMessage);

    const mentionOnly = label === '댓글' && replyPrefix && input.trim() === replyPrefix.trim();
    const visiblePrefix = label === '댓글' && replyPrefix && input.startsWith(replyPrefix)
      ? replyPrefix
      : '';

    return (
      <form className={s.composer} onSubmit={onSubmit}>
        {visiblePrefix && <span className={s.composerMention}>{visiblePrefix.trimEnd()}</span>}
        <input
          ref={composerRef}
          aria-label={label}
          placeholder={placeholder}
          value={visiblePrefix ? input.slice(visiblePrefix.length) : input}
          maxLength={(label === '채팅' ? 500 : 1000) - visiblePrefix.length}
          disabled={disabled}
          onChange={(event) => changeComposerInput({ target: { value: visiblePrefix + event.target.value } })}
          onKeyDown={(event) => {
            if (visiblePrefix && event.key === 'Backspace' && !event.currentTarget.value) {
              event.preventDefault();
              setReplyTo(null);
              setReplyPrefix('');
              setInput('');
            }
          }}
        />

        <button
          type="submit"
          aria-label={label + ' 전송'}
          disabled={!input.trim() || disabled || Boolean(mentionOnly)}
        >
          {label === '댓글' ? <SendIcon /> : <PaperPlaneIcon />}
        </button>
      </form>
    );
  }

  return (
    <section
      ref={pageRef}
      className={`${s.page} ${view === 'home' || view === 'chat' ? s.gray : ''} ${
        view === 'post' ? s.postPage : ''
      } ${view === 'write' ? s.writePage : ''} ${view === 'chat' ? s.chatPage : ''}`}
      data-radio-focus={focused ? 'true' : 'false'}
    >
      {error && !modal && (
        <p role="alert" className={s.errorNotice}>
          {error}
        </p>
      )}

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
                    style={{
                      '--team-color': team.color,
                    }}
                    aria-label={team.name + ' 게시판'}
                    onClick={() => openTeamBoard(team)}
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
                      {activeRace.onlineCount}
                    </span>
                  )}

                  <small>
                    {liveStatus === 'open' ? '종료까지' : '오픈까지'}{' '}
                    {formatRemainingTime(
                      liveStatus === 'open' ? activeRace.closesAt : activeRace.opensAt,
                      now,
                      activeRace.remaining,
                    )}
                  </small>
                </div>

                <h2>{activeRace.title}</h2>

                <button
                  type="button"
                  className={s.primary}
                  disabled={liveStatus !== 'open'}
                  onClick={() =>
                    go('chat', {
                      race: activeRace.id,
                    })
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
                    onClick={() =>
                      go('chat', {
                        race: item.id,
                      })
                    }
                  >
                    <span>
                      <small>Round {item.round}</small>
                      <strong>{item.title}</strong>
                    </span>

                    <span>
                      {item.weekendStartsAt && item.weekendEndsAt
                        ? `${formatKoreanTime(item.weekendStartsAt)} ~ ${formatKoreanTime(item.weekendEndsAt)}`
                        : '10.31 ~ 11.1'}
                    </span>
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
                go('search', {
                  board: board.id,
                })
              }
            >
              <SearchIcon />
            </button>,
          )}

          {board.color &&
            (bannerSrc ? (
              <img className={s.banner} src={bannerSrc} alt={board.name + ' 팀 소개'} />
            ) : (
              <div
                className={s.bannerPlaceholder}
                style={{
                  '--team-color': board.color,
                }}
              >
                <strong>{board.name}</strong>
                <span>팀 이미지 준비 중</span>
              </div>
            ))}

          {popularPost && (
            <button type="button" className={s.pinned} onClick={() => openPost(popularPost)}>
              <span className={s.redTag}>{popularPost.tag}</span>

              <span className={s.pinnedContent}>
                <strong className={s.pinnedTitle}>{popularPost.title}</strong>

                <PostCounts post={popularPost} className={s.pinnedCounts} />
              </span>
            </button>
          )}

          {board.id !== 'archive' && (
            <div className={s.chips}>
              {board.tagOptions.map((item) => (
                <button
                  type="button"
                  key={item.tagId ?? 'all'}
                  aria-pressed={tag === item.tagId}
                  className={tag === item.tagId ? s.selected : ''}
                  onClick={() => setTag(item.tagId)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          <div className={s.listMeta}>
            <span>글 {boardPage.totalCount}개</span>

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
            <button type="button" className={s.writeButton} onClick={() => beginWrite()}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 15 15 4a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L9 20H4Z" />
              </svg>
              글쓰기
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

            <form
              className={`${s.searchForm} ${query.length ? s.searchFilled : ''}`}
              role="search"
              onSubmit={search}
            >
              {!query.length && (
                <button type="submit" className={s.searchIconButton} aria-label="검색">
                  <SearchIcon />
                </button>
              )}

              <input
                className={s.searchInput}
                type="search"
                aria-label="게시판 검색어"
                placeholder="제목 또는 내용, 태그 입력"
                value={query}
                maxLength={100}
                enterKeyHint="search"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />

              {!!query.length && (
                <button type="submit" className={s.srOnly}>
                  검색
                </button>
              )}
            </form>
          </div>

          {!term ? (
            <>
              <div className={s.searchHistoryHeader}>
                <h2>검색 기록</h2>

                <button type="button" onClick={() => setHistory([])}>
                  지우기
                </button>
              </div>

              <div className={s.searchHistoryList}>
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
                      aria-label={`${item} 검색 기록 삭제`}
                      onClick={() =>
                        setHistory((previous) => previous.filter((value) => value !== item))
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
              <div className={s.searchResultMeta}>
                <div className={s.searchFilters} data-search-filters>
                  <SearchDropdown
                    label="검색 결과 정렬"
                    value={sort}
                    options={SEARCH_SORT_OPTIONS}
                    onChange={setSort}
                  />

                  <SearchDropdown
                    label="검색 기간"
                    value={period}
                    options={SEARCH_PERIOD_OPTIONS}
                    onChange={setPeriod}
                  />
                </div>

                <span className={s.searchResultCount} role="status" aria-live="polite">
                  글 {searchPage.totalCount}개
                </span>
              </div>

              {postRows(results)}
            </>
          )}
        </>
      )}

      {view === 'write' && (
        <>
          {header(
            post?.canEdit ? '글쓰기' : '글쓰기',
            () => {
              if (post?.canEdit) {
                go('post', {
                  board: post.boardId,
                  post: post.id,
                });
              } else {
                backToBoard();
              }
            },
          )}

          <form className={s.editor} onSubmit={publish}>
            <label>
              게시판
              <input value={board.name} readOnly />
            </label>

            <fieldset>
              <legend>태그</legend>

              <div className={s.chips}>
                {board.tagOptions.map((item) => (
                  <button
                    type="button"
                    key={item.tagId ?? 'all'}
                    aria-pressed={draft.tagId === item.tagId}
                    className={draft.tagId === item.tagId ? s.selected : ''}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        tagId: item.tagId,
                      })
                    }
                  >
                    {item.name}
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

            <div className={s.photoSection}>
              <p className={s.photoLabel}>
                사진 <span className={s.muted}>최대 5장</span>
              </p>

              <div className={s.attachments}>
                <label
                  className={s.upload}
                  data-disabled={draft.images.length >= 5 ? 'true' : 'false'}
                >
                  <CameraIcon />
                  <small>{draft.images.length} / 5</small>
                  <input
                    type="file"
                    aria-label="사진 첨부"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={draft.images.length >= 5}
                    onChange={attach}
                  />
                </label>

                {draft.images.map((image, index) => (
                  <div className={s.thumbnail} key={image.mediaId}>
                    <img src={image.url} alt={`첨부 사진 ${index + 1}`} />
                    <button
                      type="button"
                      aria-label={`첨부 사진 ${index + 1} 삭제`}
                      onClick={() =>
                        setDraft((previous) => ({
                          ...previous,
                          images: previous.images.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className={s.primary}>
              {post?.canEdit ? '완료' : '등록하기'}
            </button>
          </form>
        </>
      )}

      {view === 'post' &&
        (post ? (
          <>
            {header(board.name, backFromPost)}

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
                  onClick={() => setMenu(menu ? null : 'post')}
                >
                  <MoreIcon />
                </button>

                {menu === 'post' && (
                  <div
                    className={`${s.menu} ${!post.canEdit && !post.canDelete ? s.reportMenu : ''}`}
                  >
                    {post.canEdit || post.canDelete ? (
                      <>
                        {post.canEdit && (
                          <button type="button" onClick={() => beginWrite(true)}>
                            수정하기
                          </button>
                        )}

                        {post.canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              setModal({
                                type: 'deletePost',
                              })
                            }
                          >
                            삭제하기
                          </button>
                        )}
                      </>
                    ) : (
                      <ReportActions
                        recipient={post.authorProfile}
                        onSendMessage={onSendMessage ? sendPrivateMessage : undefined}
                        onReport={() => report('POST', post.id)}
                      />
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
                      setModal({
                        type: 'image',
                        image,
                      })
                    }
                  >
                    <img src={image} alt={`첨부 사진 ${index + 1}`} />
                  </button>
                ))}
              </div>
            </article>

            <div className={s.actions}>
              <button
                type="button"
                className={s.reactionButton}
                aria-label="게시글 좋아요"
                aria-pressed={post.liked === true}
                onClick={() => act(() => radio.toggleLike(post.id))}
              >
                <HeartIcon filled={post.liked === true} />
                <span>{post.likeCount}</span>
              </button>

              <button
                type="button"
                className={s.reactionButton}
                aria-label={`댓글 ${post.commentCount}개 작성하기`}
                onClick={() => {
                  if (requireLogin()) {
                    composerRef.current?.focus();
                  }
                }}
              >
                <CommentIcon />
                <span>{post.commentCount}</span>
              </button>

              <button
                type="button"
                className={`${s.reactionButton} ${s.bookmarkButton}`}
                aria-label="게시글 북마크"
                aria-pressed={post.saved === true}
                onClick={() => act(() => radio.toggleSave(post.id))}
              >
                <BookmarkIcon filled={post.saved === true} />

                {(post.bookmarkCount ?? 0) > 0 && <span>{post.bookmarkCount}</span>}
              </button>
            </div>

            <div className={s.comments}>
              {post.comments.map((comment) => (
                <div key={comment.id} className={`${s.comment} ${comment.replyTo ? s.reply : ''}`}>
                  {comment.replyTo && (
                    <span className={s.replyMark}>
                      <ReplyIcon />
                    </span>
                  )}

                  <span className={s.avatar} />

                  <div className={s.commentBody}>
                    {comment.isDeleted ? (
                      <p className={s.muted}>삭제된 댓글입니다.</p>
                    ) : (
                      <>
                        <div className={s.commentIdentity}>
                          <strong>{comment.nickname}</strong>
                          <small>{comment.date}</small>
                        </div>

                        <p className={s.commentText}>{renderCommentText(comment)}</p>

                        <div className={s.commentControls}>
                          <button
                            type="button"
                            aria-label={`댓글 좋아요 ${comment.likeCount}개`}
                            aria-pressed={comment.liked === true}
                            onClick={() => act(() => radio.toggleCommentLike(post.id, comment.id))}
                          >
                            <HeartIcon filled={comment.liked === true} />

                            <span>{comment.likeCount}</span>
                          </button>

                          <button type="button" onClick={() => beginReply(comment)}>
                            <CommentIcon />

                            <span>{comment.replyCount > 0 ? comment.replyCount : '답글달기'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {!comment.isDeleted && (
                    <div className={s.commentMenuWrap}>
                      <button
                        type="button"
                        className={s.more}
                        aria-label="댓글 메뉴"
                        onClick={() => setMenu(menu === comment.id ? null : comment.id)}
                      >
                        <MoreIcon />
                      </button>

                      {menu === comment.id && (
                        <div className={`${s.menu} ${!comment.mine ? s.reportMenu : ''}`}>
                          {comment.mine ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingComment(comment.id);
                                  setReplyTo(null);
                                  setReplyPrefix('');
                                  setInput(comment.text);
                                  setMenu(null);
                                  composerRef.current?.focus();
                                }}
                              >
                                수정하기
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenu(null);
                                  setModal({
                                    type: 'deleteComment',
                                    id: comment.id,
                                  });
                                }}
                              >
                                삭제하기
                              </button>
                            </>
                          ) : (
                            <ReportActions
                              recipient={comment.author}
                              onSendMessage={onSendMessage ? sendPrivateMessage : undefined}
                              onReport={() => report('COMMENT', comment.id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={s.composerWrap}>
              {editingComment && (
                <button
                  type="button"
                  className={s.replyNotice}
                  onClick={() => {
                    setEditingComment(null);
                    setInput('');
                  }}
                >
                  댓글 수정 중 · 취소 ×
                </button>
              )}

              {composer(addComment, '댓글', '메시지를 입력하세요')}
            </div>
          </>
        ) : (
          <>
            {header('게시글', backFromPost)}
            <p className={s.empty}>게시글을 찾을 수 없어요.</p>
          </>
        ))}

      {view === 'chat' && (
        <div className={`${s.chatRoom} ${!canSendMessage ? s.readOnlyChat : ''}`}>
          {header(
            <>
              {race.title}

              <small className={s.chatLiveMeta}>
                {chatOpen ? (
                  <>
                    <Asset name="live" fallback="LIVE" className={s.liveBadge} />

                    <span>종료까지 {formatRemainingTime(race.closesAt, now, race.remaining || '2일 3시간 40분')}</span>
                  </>
                ) : (
                  '지난 채팅'
                )}
              </small>
            </>,
            () =>
              go('home', {
                tab: 'chat',
              }),
            <span className={s.memberCount}>
              <MemberIcon />
              {race.onlineCount}
            </span>,
          )}

          <div className={s.chatNotice}>
            <BellIcon />{' '}
            {chatOpen
              ? '경기 시작 전후 1시간 운영 · 종료 후 지난 채팅방에서 열람만 가능'
              : chatScheduled
                ? '아직 오픈 전인 채팅방입니다.'
                : '종료된 채팅입니다. 조회만 가능합니다.'}
          </div>

          <div className={s.messages}>
            {chatMessages.map((message) => (
              <div key={message.id}>
                <div className={`${s.message} ${message.mine ? s.mine : ''}`}>
                  {!message.mine && <span className={s.avatar} />}

                  <div>
                    {!message.mine && <small>{message.nickname}</small>}

                    <div className={s.bubbleRow}>
                      <button
                        type="button"
                        className={s.bubble}
                        aria-label={
                          (message.mine ? '내 메시지: ' : '메시지: ') +
                          (message.isDeleted ? '삭제된 메시지입니다.' : (messageEdits[message.id] ?? message.text))
                        }
                        onContextMenu={(event) => {
                          event.preventDefault();

                          if (!message.isDeleted && !(message.mine && !chatOpen)) {
                            setMenu(message.id);
                          }
                        }}
                        onClick={() => {
                          if (!message.isDeleted && !(message.mine && !chatOpen)) {
                            setMenu(menu === message.id ? null : message.id);
                          }
                        }}
                      >
                        {message.isDeleted ? '삭제된 메시지입니다.' : (messageEdits[message.id] ?? message.text)}
                      </button>

                      <small>{message.date}</small>
                    </div>

                    {menu === message.id &&
                      !message.isDeleted &&
                      !(message.mine && !chatOpen) && (
                      <div className={`${s.messageMenu} ${!message.canDelete ? s.reportMenu : ''}`}>
                        {message.canDelete ? (
                          <>
                          <button type="button" onClick={() => {
                            setEditingMessage(message.id);
                            setInput(messageEdits[message.id] ?? message.text);
                            setMenu(null);
                            requestAnimationFrame(() => composerRef.current?.focus());
                          }}>수정하기</button>
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
                          <ReportActions
                            recipient={message.sender}
                            onSendMessage={onSendMessage ? sendPrivateMessage : undefined}
                            onReport={() => report('CHAT_MESSAGE', message.id)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!canSendMessage && (
              <p className={s.chatEnded}>
                {!radio.isAuthenticated && chatOpen
                  ? '로그인 후 채팅에 참여할 수 있어요.'
                  : chatScheduled
                    ? '아직 채팅방이 열리지 않았어요.'
                    : '현재 메시지를 전송할 수 없는 방입니다.'}
              </p>
            )}

            <div ref={chatEndRef} />
          </div>

          {canSendMessage ? (
            <div className={s.composerWrap}>
              {composer(sendMessage, '채팅', '메시지를 입력해주세요')}
            </div>
          ) : null}
        </div>
      )}

      {modal && (
        <Modal
          variant={
            modal.type === 'image'
              ? 'image'
              : modal.type === 'report'
                ? 'report'
                : modal.type === 'reported'
                  ? 'reported'
                  : 'delete'
          }
          onClose={() => setModal(null)}
        >
          {modal.type === 'image' ? (
            <img className={s.fullImage} src={modal.image} alt="첨부 사진 확대" />
          ) : modal.type === 'report' ? (
            <form onSubmit={submitReport}>
              <h2>신고 사유를 선택해 주세요.</h2>

              {error && (
                <p role="alert" className={s.errorNotice}>
                  {error}
                </p>
              )}

              <fieldset className={s.reasons}>
                <legend className={s.srOnly}>신고 사유</legend>

                {REPORT_REASONS.map((item) => (
                  <label key={item.value}>
                    <input
                      type="radio"
                      name="reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={() => setReason(item.value)}
                    />

                    {item.label}
                  </label>
                ))}

                <input
                  type="text"
                  aria-label="기타 신고 사유"
                  placeholder="직접 입력"
                  maxLength={1000}
                  required={reason === 'OTHER'}
                  onFocus={() => setReason('OTHER')}
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                />
              </fieldset>

              <button type="submit" className={s.darkButton}>
                신고하기
              </button>
            </form>
          ) : modal.type === 'reported' ? (
            <>
              <span className={s.reportSiren} aria-hidden="true">
                🚨
              </span>

              <h2>신고 완료</h2>

              <p className={s.muted}>신고된 내용은 검토후 조치할 예정입니다.</p>

              <button type="button" className={s.darkButton} onClick={() => setModal(null)}>
                닫기
              </button>
            </>
          ) : (
            <>
              <h2>{modal.type === 'deletePost' ? '이 글을 삭제할까요?' : '삭제할까요?'}</h2>

              {error && (
                <p role="alert" className={s.errorNotice}>
                  {error}
                </p>
              )}

              <p className={s.muted}>
                {modal.type === 'deletePost'
                  ? '삭제된 글은 복구할 수 없습니다.'
                  : '삭제된 내용은 복구할 수 없습니다.'}
              </p>

              <div className={s.modalActions}>
                <button type="button" className={s.darkButton} onClick={() => setModal(null)}>
                  뒤로가기
                </button>

                <button
                  type="button"
                  className={s.primary}
                  onClick={() => {
                    try {
                      if (modal.type === 'deletePost') {
                        radio.deletePost(post.id);
                        backToBoard();
                      }

                      if (modal.type === 'deleteComment') {
                        radio.deleteComment(post.id, modal.id);
                      }

                      if (modal.type === 'deleteMessage') {
                        radio.deleteMessage(race.id, modal.id);
                      }

                      setModal(null);
                      setMenu(null);
                      setError('');
                    } catch (error) {
                      setError(error.message);
                    }
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