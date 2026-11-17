import { useEffect, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import useTeamRadioData from './useTeamRadioData';

import {
  formatKoreanTime,
  formatPostDate,
  formatKoreanDate,
  formatChatTime,
  formatSessionDate,
  getMessageSession,
  REPORT_REASONS,
  findTeamBoard,
} from './radioModel';

import { useGarageProfile } from '../../shared/garageProfile';
import LoginRequiredModal from '../../components/common/LoginRequiredModal/LoginRequiredModal';

import s from './TeamRadio.module.scss';
import backIcon from '../../assets/images/teamradio/back-button.svg';
import reportSiren from '../../assets/images/teamradio/🚨.svg';

const assets = import.meta.glob(
  '../../assets/images/teamradio/*.{svg,png,jpg,jpeg,webp}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

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

function ChevronIcon({
  direction = 'right',
  className = '',
}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      aria-hidden="true"
    >
      <path
        d={
          direction === 'down'
            ? 'm3 6 5 5 5-5'
            : 'm6 2 6 6-6 6'
        }
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <img
      src={backIcon}
      width="22"
      height="22"
      alt=""
      aria-hidden="true"
    />
  );
}

function DropdownIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="9"
      viewBox="0 0 10 9"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.7627 8.25L9.52584 0H-0.000444412L4.7627 8.25Z"
        fill="#5A5A5B"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.125 9.8125C4.125 12.9515 6.67348 15.5 9.8125 15.5C12.9515 15.5 15.5 12.9515 15.5 9.8125C15.5 6.67348 12.9515 4.125 9.8125 4.125C6.67348 4.125 4.125 6.67348 4.125 9.8125V9.8125"
        strokeWidth="1.575"
        stroke="#111111"
      />
      <path
        d="M16.041 14.667L19.9785 18.6045"
        strokeWidth="1.575"
        stroke="#111111"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="14"
      viewBox="0 0 15 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.25 10.5696H4.36111C3.89889 10.5696 3.37889 10.8221 2.91667 11.271L1.47222 12.6739C1.20572 12.9327 0.75 12.4901 0.75 11.9724V2.15281C0.75 1.78076 0.902182 1.42395 1.17307 1.16087C1.44395 0.897795 1.81135 0.75 2.19444 0.75H12.3056C12.6886 0.75 13.056 0.897795 13.3269 1.16087C13.5978 1.42395 13.75 1.78076 13.75 2.15281V9.16684C13.75 9.53889 13.5978 9.89569 13.3269 10.1588C13.056 10.4218 12.6886 10.5696 12.3056 10.5696H7.25Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#8B8B8B"
      />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
    >
      <path
        d="M1.83348 1.79702C0.428866 3.19247 0.34936 5.06185 1.83348 6.85224C3.3176 8.64263 7.76997 12.75 7.76997 12.75C7.76997 12.75 12.3283 8.64263 13.7065 6.85224C15.0846 5.06185 15.1111 3.19247 13.7065 1.79702C13.3724 1.46508 12.9757 1.20176 12.5392 1.02211C12.1026 0.842464 11.6348 0.75 11.1622 0.75C10.6897 0.75 10.2219 0.842464 9.78532 1.02211C9.34878 1.20176 8.95214 1.46508 8.61804 1.79702L7.76997 2.63956L6.9219 1.79702C6.5878 1.46508 6.19115 1.20176 5.75461 1.02211C5.31808 0.842464 4.8502 0.75 4.37769 0.75C3.90518 0.75 3.4373 0.842464 3.00076 1.02211C2.56423 1.20176 2.16758 1.46508 1.83348 1.79702Z"
        strokeWidth="1.5"
        stroke="#8B8B8B"
      />
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
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.25 5.8125H17.0625L16.3031 3.68438C16.2507 3.53875 16.1545 3.41288 16.0278 3.32395C15.9011 3.23502 15.7501 3.18736 15.5953 3.1875H8.40469C8.08828 3.1875 7.80469 3.38672 7.69922 3.68438L6.9375 5.8125H3.75C2.71406 5.8125 1.875 6.65156 1.875 7.6875V18.375C1.875 19.4109 2.71406 20.25 3.75 20.25H20.25C21.2859 20.25 22.125 19.4109 22.125 18.375V7.6875C22.125 6.65156 21.2859 5.8125 20.25 5.8125ZM20.4375 18.375C20.4375 18.4781 20.3531 18.5625 20.25 18.5625H3.75C3.64688 18.5625 3.5625 18.4781 3.5625 18.375V7.6875C3.5625 7.58438 3.64688 7.5 3.75 7.5H8.12578L8.52656 6.37969L9.06328 4.875H14.9344L15.4711 6.37969L15.8719 7.5H20.25C20.3531 7.5 20.4375 7.58438 20.4375 7.6875V18.375ZM12 9C9.92813 9 8.25 10.6781 8.25 12.75C8.25 14.8219 9.92813 16.5 12 16.5C14.0719 16.5 15.75 14.8219 15.75 12.75C15.75 10.6781 14.0719 9 12 9ZM12 15C10.7578 15 9.75 13.9922 9.75 12.75C9.75 11.5078 10.7578 10.5 12 10.5C13.2422 10.5 14.25 11.5078 14.25 12.75C14.25 13.9922 13.2422 15 12 15Z"
        fill="black"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
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
      <span
        className={s.countItem}
        aria-label={`좋아요 ${post.likeCount}개`}
      >
        <HeartIcon />
        {post.likeCount}
      </span>

      <span
        className={s.countItem}
        aria-label={`댓글 ${post.commentCount}개`}
      >
        <CommentIcon />
        {post.commentCount}
      </span>
    </span>
  );
}

function MemberIcon({ single = false }) {
  if (single) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 13.25C1 12.3217 1.36875 11.4315 2.02513 10.7751C2.6815 10.1187 3.57174 9.75 4.5 9.75H11.5C12.4283 9.75 13.3185 10.1187 13.9749 10.7751C14.6313 11.4315 15 12.3217 15 13.25C15 13.7141 14.8156 14.1592 14.4874 14.4874C14.1592 14.8156 13.7141 15 13.25 15H2.75C2.28587 15 1.84075 14.8156 1.51256 14.4874C1.18437 14.1592 1 13.7141 1 13.25Z"
          strokeWidth="2"
          strokeLinejoin="round"
          stroke="#F5F5F6"
        />
        <path
          d="M10.625 3.625C10.625 5.07475 9.44975 6.25 8 6.25C6.55025 6.25 5.375 5.07475 5.375 3.625C5.375 2.17525 6.55025 1 8 1C9.44975 1 10.625 2.17525 10.625 3.625Z"
          strokeWidth="2"
          stroke="#F5F5F6"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      strokeWidth="1.46667"
      stroke="#5A5A5B"
      aria-hidden="true"
    >
      <path d="M5.04175 7.33333C5.04175 9.10406 6.47935 10.5417 8.25008 10.5417C10.0208 10.5417 11.4584 9.10406 11.4584 7.33333C11.4584 5.56261 10.0208 4.125 8.25008 4.125C6.47935 4.125 5.04175 5.56261 5.04175 7.33333V7.33333" />
      <path d="M2.29175 18.3333C3.20841 15.125 5.50008 13.2916 8.25008 13.2916C11.0001 13.2916 13.2917 15.125 14.2084 18.3333" />
      <path d="M14.6667 4.40002C15.8272 4.91416 16.5755 6.0641 16.5755 7.33336C16.5755 8.60262 15.8272 9.75255 14.6667 10.2667M16.5001 13.5667C18.1501 14.3 19.2501 15.95 19.7084 18.3334" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0.335449 7.41667L13.6688 0.75L8.66878 14.0833L6.16878 9.08333L0.335449 7.41667"
        strokeWidth="1.5"
        strokeLinejoin="round"
        stroke="white"
      />
    </svg>
  );
}

function Asset({
  name,
  fallback,
  className = '',
  selected = false,
  hoverName,
}) {
  const selectedSrc =
    selected && hoverName
      ? assets[`../../assets/images/teamradio/${hoverName}.svg`]
      : null;

  const src =
    selectedSrc ||
    assets[`../../assets/images/teamradio/${name}.svg`];

  return src ? (
    <img className={className} src={src} alt={fallback} />
  ) : (
    <span className={className}>{fallback}</span>
  );
}

function Modal({
  children,
  onClose,
  variant = 'default',
}) {
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
      {variant === 'image' ? (
        <div className={s.imageViewer}>
          {children}

          <button
            type="button"
            className={s.imageModalClose}
            aria-label="팝업 닫기"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
      ) : (
        children
      )}
    </dialog>
  );
}

function SearchDropdown({
  label,
  value,
  options,
  onChange,
}) {
  const ref = useRef(null);

  const selected =
    options.find((option) => option.value === value) ??
    options[0];

  useEffect(() => {
    function onPointerDown(event) {
      const dropdown = ref.current;

      if (
        dropdown?.open &&
        !dropdown.contains(event.target)
      ) {
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
        <DropdownIcon className={s.sortArrow} />
      </summary>

      <div
        className={s.sortMenu}
        role="group"
        aria-label={`${label} 옵션`}
      >
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={
              value === option.value ? s.sortActive : ''
            }
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

function ReportActions({
  recipient,
  onSendMessage,
  onReport,
}) {
  return (
    <>
      <button
        type="button"
        disabled={!onSendMessage}
        onClick={() => onSendMessage?.(recipient)}
      >
        쪽지 보내기
      </button>

      <button
        type="button"
        className={s.reportAction}
        onClick={onReport}
      >
        신고하기
      </button>
    </>
  );
}

function formatRemainingTime(target, now, fallback) {
  const timestamp = Date.parse(target);

  if (!Number.isFinite(timestamp)) {
    return fallback || '시간 미정';
  }

  const totalMinutes = Math.max(
    0,
    Math.ceil((timestamp - now) / 60000),
  );

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    days > 0 && `${days}일`,
    (days > 0 || hours > 0) && `${hours}시간`,
    `${minutes}분`,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function TeamRadio({
  liveStatus = 'open',
  currentUser = null,
  onSendMessage,
  onLogin,
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate(); 
  const garageProfile = useGarageProfile();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const radio = useTeamRadioData({
    liveStatus,
    currentUser,
  });

  const { boards, teams, races, posts } = radio;

  const view = params.get('view') || 'home';
  const tab =
    params.get('tab') === 'chat' ? 'chat' : 'board';

  const board =
    boards.find((item) => item.id === params.get('board')) ||
    boards[0];

  const bannerSrc = board.banner
    ? assets[`../../assets/images/teamradio/${board.banner}`]
    : null;

  const race =
    races.find((item) => item.id === params.get('race')) ||
    races[0];

  const post = posts.find(
    (item) => item.id === params.get('post'),
  );

  const [tag, setTag] = useState(null);
  const [sort, setSort] = useState('latest');
  const [period, setPeriod] = useState('all');

  const [query, setQuery] = useState(
    () => params.get('q') || '',
  );

  const [history, setHistory] = useState([
    '공구',
    '루이스',
    '같이',
  ]);

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
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const composerRef = useRef(null);
  const pageRef = useRef(null);
  const searchReturnRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (view !== 'chat') return;

    const page = pageRef.current;
    if (!page) return;

    const content =
      page.closest('main.content') || page.parentElement;

    if (!content) return;

    const syncChatHeight = () => {
      const viewportHeight =
        window.visualViewport?.height ||
        window.innerHeight;

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
    window.visualViewport?.addEventListener(
      'resize',
      syncChatHeight,
    );

    return () => {
      observer.disconnect();

      window.removeEventListener('resize', syncChatHeight);
      window.visualViewport?.removeEventListener(
        'resize',
        syncChatHeight,
      );
    };
  }, [view]);

  const activeRace =
    races.find((item) => item.status === 'LIVE') ??
    races.find((item) => item.status === 'SCHEDULED') ??
    races[0];

  const chatOpen = race.status === 'LIVE';
  const chatScheduled = race.status === 'SCHEDULED';

  const canSendMessage =
    radio.isAuthenticated &&
    race.canSendMessage === true;

  const chatMessages = radio
    .getMessages(race.id)
    .filter((message) => !message.isDeleted);

  const focused = [
    'post',
    'write',
    'search',
    'chat',
  ].includes(view);

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
    const target = findTeamBoard(
      boards,
      String(team.teamId ?? team.id),
    );

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
    const returnTo = location.state?.myRadioReturnTo;

    if (
      typeof returnTo === 'string' &&
      /^\/my-garage\/radio(?:\?|$)/.test(returnTo)
    ) {
      navigate(returnTo, { replace: true });
      return;
    }

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

    setMenu(null);
    setModal(null);
    setError('');
    setLoginModalOpen(true);

    return false;
  }

  function handleLogin() {
    setLoginModalOpen(false);

    if (typeof onLogin !== 'function') {
      setError('로그인 화면이 아직 연결되지 않았어요.');
      return;
    }

    onLogin();
  }

  function act(action) {
    if (!requireLogin()) return;

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

    if (!requireLogin()) return;

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

    if (!requireLogin()) return;

    if (draft.images.length + files.length > 5) {
      setError('사진은 최대 5장까지 첨부할 수 있어요.');
      return;
    }

    try {
      const images = await radio.uploadImages(files);

      setDraft((previous) => ({
        ...previous,
        images: [
          ...previous.images,
          ...images,
        ].slice(0, 5),
      }));

      setError('');
    } catch (error) {
      setError(
        error.message || '사진을 읽지 못했어요.',
      );
    }
  }

  function beginReply(comment) {
    if (!requireLogin()) return;

    const parentId = comment.replyTo ?? comment.id;

    const parent = post.comments.find(
      (item) => item.id === parentId,
    );

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

    if (
      replyPrefix &&
      value !== replyPrefix.trimEnd() &&
      !value.startsWith(replyPrefix)
    ) {
      setReplyTo(null);
      setReplyPrefix('');
    }
  }

  function sendPrivateMessage(recipient) {
    if (!requireLogin()) return;

    setMenu(null);

    if (!recipient?.userId) {
      setError('쪽지를 받을 사용자를 확인할 수 없어요.');
      return;
    }

    if (!onSendMessage) {
      setError('쪽지 기능이 아직 연결되지 않았어요.');
      return;
    }

    onSendMessage(recipient);
  }

  function addComment(event) {
    event.preventDefault();

    if (!requireLogin()) return;
    if (!input.trim()) return;

    if (
      replyPrefix &&
      input.trim() === replyPrefix.trim()
    ) {
      setError('답글 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingComment) {
        radio.updateComment(
          post.id,
          editingComment,
          input,
        );
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

    if (!requireLogin()) return;

    if (!canSendMessage || !input.trim()) {
      return;
    }

    try {
      if (editingMessage) {
        // 채팅 수정 API 연결 전에는 현재 화면에서만 수정합니다.
        setMessageEdits((previous) => ({
          ...previous,
          [editingMessage]: input.trim(),
        }));

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
        const messages =
          chatEndRef.current?.parentElement;

        if (messages) {
          messages.scrollTop = messages.scrollHeight;
        }
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
      [
        query.trim(),
        ...previous.filter(
          (item) => item !== query.trim(),
        ),
      ].slice(0, 8),
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

    if (!requireLogin()) return;

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
          aria-label={
            view === 'write'
              ? '글쓰기 닫기'
              : '뒤로가기'
          }
          onClick={onBack}
        >
          {view === 'write' ? <CloseIcon /> : <BackIcon />}
        </button>

        <h1>{title}</h1>

        {action || <span className={s.iconButton} />}
      </header>
    );
  }

  function isArchivePost(item) {
    return (
      boards.find(
        (entry) => entry.id === item.boardId,
      )?.type === 'ARCHIVE'
    );
  }

  function postDate(item) {
    return isArchivePost(item)
      ? formatKoreanDate(item.createdAt)
      : formatPostDate(item.createdAt, now);
  }

  function postRows(items) {
    if (!items.length) {
      return (
        <p className={s.empty}>
          아직 게시글이 없습니다.
        </p>
      );
    }

    return items.map((item) => (
      <button
        type="button"
        className={s.postRow}
        key={item.id}
        onClick={() => openPost(item)}
      >
        <span className={s.redTag}>
          {isArchivePost(item)
            ? '미사용태그'
            : item.tag}
        </span>

        <strong>{item.title}</strong>

        <span className={s.postMeta}>
          <span>
            {item.author} · {postDate(item)}
          </span>

          <PostCounts post={item} />
        </span>
      </button>
    ));
  }

  function renderCommentText(comment) {
    const text = comment.text ?? '';

    if (!comment.replyTo || !text.startsWith('@')) {
      return text;
    }

    const names = [
      ...new Set(
        [
          post?.author,
          ...(post?.comments ?? []).map(
            (item) => item.nickname,
          ),
        ].filter(Boolean),
      ),
    ].sort((a, b) => b.length - a.length);

    const name = names.find((nickname) => {
      const prefix = `@${nickname}`;

      return (
        text.startsWith(prefix) &&
        (
          text.length === prefix.length ||
          /\s/.test(text[prefix.length])
        )
      );
    });

    const mention = name
      ? `@${name}`
      : text.match(/^@\S+/)?.[0];

    if (!mention) return text;

    return (
      <>
        <span className={s.mention}>
          {mention}
        </span>

        {text.slice(mention.length)}
      </>
    );
  }

  function composer(onSubmit, label, placeholder) {
    if (
      label === '댓글' &&
      !radio.isAuthenticated
    ) {
      return (
        <button
          type="button"
          className={s.commentLoginButton}
          onClick={() => requireLogin()}
        >
          {placeholder}
        </button>
      );
    }

    const disabled =
      !radio.isAuthenticated ||
      (label === '채팅' && !canSendMessage);

    const mentionOnly =
      label === '댓글' &&
      replyPrefix &&
      input.trim() === replyPrefix.trim();

    const visiblePrefix =
      label === '댓글' &&
      replyPrefix &&
      input.startsWith(replyPrefix)
        ? replyPrefix
        : '';

    return (
      <form
        className={s.composer}
        onSubmit={onSubmit}
      >
        {visiblePrefix && (
          <span className={s.composerMention}>
            {visiblePrefix.trimEnd()}
          </span>
        )}

        <input
          ref={composerRef}
          aria-label={label}
          placeholder={placeholder}
          value={
            visiblePrefix
              ? input.slice(visiblePrefix.length)
              : input
          }
          maxLength={
            (label === '채팅' ? 500 : 1000) -
            visiblePrefix.length
          }
          disabled={disabled}
          onChange={(event) =>
            changeComposerInput({
              target: {
                value:
                  visiblePrefix +
                  event.target.value,
              },
            })
          }
          onKeyDown={(event) => {
            if (
              visiblePrefix &&
              event.key === 'Backspace' &&
              !event.currentTarget.value
            ) {
              event.preventDefault();
              setReplyTo(null);
              setReplyPrefix('');
              setInput('');
            }
          }}
        />

        <button
          type="submit"
          aria-label={`${label} 전송`}
          disabled={
            !input.trim() ||
            disabled ||
            Boolean(mentionOnly)
          }
        >
          {label === '댓글'
            ? <SendIcon />
            : <PaperPlaneIcon />}
        </button>
      </form>
    );
  }

  return (
    <section
      ref={pageRef}
      className={`${s.page} ${
        view === 'home' || view === 'chat'
          ? s.gray
          : ''
      } ${
        view === 'post'
          ? s.postPage
          : ''
      } ${
        view === 'write'
          ? s.writePage
          : ''
      } ${
        view === 'chat'
          ? s.chatPage
          : ''
      }`}
      data-radio-focus={focused ? 'true' : 'false'}
    >
      {error && !modal && view !== 'write' && (
        <p
          role="alert"
          className={s.errorNotice}
        >
          {error}
        </p>
      )}

      {view === 'home' && (
        <>
          <div className={s.homeHeader}>
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
                ['board', '게시판'],
                ['chat', '채팅'],
              ].map(([id, name]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={tab === id}
                  className={
                    tab === id ? s.selected : ''
                  }
                  onClick={() =>
                    setParams({ tab: id })
                  }
                >
                  {name}
                </button>
              ))}
            </div>
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
                    aria-label={`${team.name} 게시판`}
                    onClick={() => openTeamBoard(team)}
                  >
                    <Asset
                      name={team.asset}
                      hoverName={`${team.asset}_선택`}
                      selected={
                        garageProfile.team === team.name
                      }
                      fallback={team.name}
                    />
                  </button>
                ))}

                <button
                  type="button"
                  className={s.teamCard}
                  onClick={() =>
                    openBoard(boards.at(-1))
                  }
                >
                  <Asset
                    name="아카이브"
                    fallback="아카이브"
                  />
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

                      <span>
                        <ChevronIcon direction="right" />
                      </span>
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <article className={s.liveCard}>
                <div className={s.liveMeta}>
                  <Asset
                    name="live"
                    fallback="LIVE"
                    className={s.liveBadge}
                  />

                  {liveStatus === 'open' && (
                    <span className={s.memberCount}>
                      <MemberIcon single />
                      {activeRace.onlineCount}
                    </span>
                  )}

                  <small>
                    {liveStatus === 'open'
                      ? '종료까지'
                      : '오픈까지'}{' '}
                    {formatRemainingTime(
                      liveStatus === 'open'
                        ? activeRace.closesAt
                        : activeRace.opensAt,
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
                  {liveStatus === 'open'
                    ? '입장하기'
                    : '오픈 전'}
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
                      {item.weekendStartsAt &&
                      item.weekendEndsAt
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

          {board.color && (
            bannerSrc ? (
              <img
                className={s.banner}
                src={bannerSrc}
                alt={`${board.name} 팀 소개`}
              />
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
            )
          )}

          {popularPost && (
            <button
              type="button"
              className={s.pinned}
              onClick={() => openPost(popularPost)}
            >
              <span className={s.redTag}>
                {popularPost.tag}
              </span>

              <span className={s.pinnedContent}>
                <strong className={s.pinnedTitle}>
                  {popularPost.title}
                </strong>

                <PostCounts
                  post={popularPost}
                  className={s.pinnedCounts}
                />
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
                  className={
                    tag === item.tagId
                      ? s.selected
                      : ''
                  }
                  onClick={() => setTag(item.tagId)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          <div className={s.listMeta}>
            <span>
              글 {boardPage.totalCount}개
            </span>

            <details className={s.sortDropdown}>
              <summary>
                {sort === 'popular'
                  ? '인기순'
                  : '최신순'}

                <DropdownIcon className={s.sortArrow} />
              </summary>

              <div className={s.sortMenu}>
                {[
                  ['latest', '최신순'],
                  ['popular', '인기순'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      sort === value
                        ? s.sortActive
                        : ''
                    }
                    aria-pressed={sort === value}
                    onClick={(event) => {
                      setSort(value);

                      event.currentTarget
                        .closest('details')
                        .open = false;
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
              <BackIcon />
            </button>

            <form
              className={`${s.searchForm} ${
                query.length ? s.searchFilled : ''
              }`}
              role="search"
              onSubmit={search}
            >
              {!query.length && (
                <button
                  type="submit"
                  className={s.searchIconButton}
                  aria-label="검색"
                >
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
                onChange={(event) =>
                  setQuery(event.target.value)
                }
              />

              {!!query.length && (
                <button
                  type="submit"
                  className={s.srOnly}
                >
                  검색
                </button>
              )}
            </form>
          </div>

          {!term ? (
            <>
              <div className={s.searchHistoryHeader}>
                <h2>검색 기록</h2>

                <button
                  type="button"
                  onClick={() => setHistory([])}
                >
                  지우기
                </button>
              </div>

              <div className={s.searchHistoryList}>
                {history.map((item) => (
                  <span
                    key={item}
                    className={s.historyItem}
                  >
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
              <div className={s.searchResultMeta}>
                <div
                  className={s.searchFilters}
                  data-search-filters
                >
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

                <span
                  className={s.searchResultCount}
                  role="status"
                  aria-live="polite"
                >
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
            '글쓰기',
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

          <form
            className={s.editor}
            onSubmit={publish}
          >
            {error && !modal && (
              <p
                role="alert"
                className={s.errorNotice}
              >
                {error}
              </p>
            )}

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
                    aria-pressed={
                      draft.tagId === item.tagId
                    }
                    className={
                      draft.tagId === item.tagId
                        ? s.selected
                        : ''
                    }
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
              제목
              <small>
                {draft.title.length} / 20
              </small>

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
                사진{' '}
                <span className={s.muted}>
                  최대 5장
                </span>
              </p>

              <div className={s.attachments}>
                <label
                  className={s.upload}
                  data-disabled={
                    draft.images.length >= 5
                      ? 'true'
                      : 'false'
                  }
                >
                  <CameraIcon />

                  <small>
                    {draft.images.length} / 5
                  </small>

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
                  <div
                    className={s.thumbnail}
                    key={image.mediaId}
                  >
                    <img
                      src={image.url}
                      alt={`첨부 사진 ${index + 1}`}
                    />

                    <button
                      type="button"
                      aria-label={`첨부 사진 ${index + 1} 삭제`}
                      onClick={() =>
                        setDraft((previous) => ({
                          ...previous,
                          images: previous.images.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                      }
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={s.primary}
            >
              {post?.canEdit
                ? '완료'
                : '등록하기'}
            </button>
          </form>
        </>
      )}

      {view === 'post' && (
        post ? (
          <>
            {header(board.name, backFromPost)}

            <article className={s.article}>
              <div className={s.author}>
                <span className={s.avatar} />

                <span>
                  <strong>
                    {isArchivePost(post)
                      ? `${post.author} · ${postDate(post)}`
                      : post.author}
                  </strong>

                  {!isArchivePost(post) && (
                    <small>
                      {postDate(post)}
                    </small>
                  )}
                </span>

                <button
                  type="button"
                  aria-label="게시글 메뉴"
                  className={s.more}
                  onClick={() =>
                    setMenu(
                      menu === 'post'
                        ? null
                        : 'post',
                    )
                  }
                >
                  <MoreIcon />
                </button>

                {menu === 'post' && (
                  <div
                    className={`${s.menu} ${
                      !post.canEdit && !post.canDelete
                        ? s.reportMenu
                        : ''
                    }`}
                  >
                    {post.canEdit || post.canDelete ? (
                      <>
                        {post.canEdit && (
                          <button
                            type="button"
                            onClick={() => beginWrite(true)}
                          >
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
                        onSendMessage={sendPrivateMessage}
                        onReport={() =>
                          report('POST', post.id)
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              <span className={s.redTag}>
                {isArchivePost(post)
                  ? '미사용태그'
                  : post.tag}
              </span>

              <h2>{post.title}</h2>

              <p className={s.body}>
                {post.body}
              </p>

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
                className={s.reactionButton}
                aria-label="게시글 좋아요"
                aria-pressed={post.liked === true}
                onClick={() =>
                  act(() => radio.toggleLike(post.id))
                }
              >
                <HeartIcon
                  filled={post.liked === true}
                />

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
                onClick={() =>
                  act(() => radio.toggleSave(post.id))
                }
              >
                <BookmarkIcon
                  filled={post.saved === true}
                />

                {(post.bookmarkCount ?? 0) > 0 && (
                  <span>{post.bookmarkCount}</span>
                )}
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
                  {comment.replyTo && (
                    <span className={s.replyMark}>
                      <ReplyIcon />
                    </span>
                  )}

                  <span className={s.avatar} />

                  <div className={s.commentBody}>
                    {comment.isDeleted ? (
                      <p className={s.muted}>
                        삭제된 댓글입니다.
                      </p>
                    ) : (
                      <>
                        <div className={s.commentIdentity}>
                          <strong>
                            {comment.nickname}
                          </strong>

                          <small>{comment.date}</small>
                        </div>

                        <p className={s.commentText}>
                          {renderCommentText(comment)}
                        </p>

                        <div className={s.commentControls}>
                          <button
                            type="button"
                            aria-label={`댓글 좋아요 ${comment.likeCount}개`}
                            aria-pressed={
                              comment.liked === true
                            }
                            onClick={() =>
                              act(() =>
                                radio.toggleCommentLike(
                                  post.id,
                                  comment.id,
                                ),
                              )
                            }
                          >
                            <HeartIcon
                              filled={
                                comment.liked === true
                              }
                            />

                            <span>
                              {comment.likeCount}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              beginReply(comment)
                            }
                          >
                            <CommentIcon />

                            <span>
                              {comment.replyCount > 0
                                ? comment.replyCount
                                : '답글달기'}
                            </span>
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
                        onClick={() =>
                          setMenu(
                            menu === comment.id
                              ? null
                              : comment.id,
                          )
                        }
                      >
                        <MoreIcon />
                      </button>

                      {menu === comment.id && (
                        <div
                          className={`${s.menu} ${
                            !comment.mine
                              ? s.reportMenu
                              : ''
                          }`}
                        >
                          {comment.mine ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingComment(
                                    comment.id,
                                  );

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
                              onSendMessage={
                                sendPrivateMessage
                              }
                              onReport={() =>
                                report(
                                  'COMMENT',
                                  comment.id,
                                )
                              }
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

              {composer(
                addComment,
                '댓글',
                '메시지를 입력하세요',
              )}
            </div>
          </>
        ) : (
          <>
            {header('게시글', backFromPost)}

            <p className={s.empty}>
              게시글을 찾을 수 없어요.
            </p>
          </>
        )
      )}

      {view === 'chat' && (
        <div
          className={`${s.chatRoom} ${
            !canSendMessage ? s.readOnlyChat : ''
          }`}
        >
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

                    <span>
                      종료까지{' '}
                      {formatRemainingTime(
                        race.closesAt,
                        now,
                        race.remaining ||
                          '2일 3시간 40분',
                      )}
                    </span>
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
            {chatMessages.map((message, index) => {
              const session =
                getMessageSession(message, race);

              const previousMessage =
                chatMessages[index - 1];

              const previousSession =
                previousMessage
                  ? getMessageSession(
                      previousMessage,
                      race,
                    )
                  : null;

              const showSession =
                session &&
                (
                  index === 0 ||
                  session.id !== previousSession?.id
                );

              return (
                <div key={message.id}>
                  {showSession && (
                    <div className={s.sessionDivider}>
                      <p className={s.session}>
                        {session.name}
                      </p>

                      <p className={s.day}>
                        {formatSessionDate(
                          session.startsAt,
                        )}
                      </p>
                    </div>
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
                      {!message.mine && (
                        <small>
                          {message.nickname}
                        </small>
                      )}

                      <div className={s.bubbleRow}>
                        <button
                          type="button"
                          className={s.bubble}
                          aria-label={
                            (
                              message.mine
                                ? '내 메시지: '
                                : '메시지: '
                            ) +
                            (
                              message.isDeleted
                                ? '삭제된 메시지입니다.'
                                : (
                                    messageEdits[message.id] ??
                                    message.text
                                  )
                            )
                          }
                          onContextMenu={(event) => {
                            event.preventDefault();

                            if (!message.isDeleted) {
                              setMenu(message.id);
                            }
                          }}
                          onClick={() => {
                            if (!message.isDeleted) {
                              setMenu(
                                menu === message.id
                                  ? null
                                  : message.id,
                              );
                            }
                          }}
                        >
                          {message.isDeleted
                            ? '삭제된 메시지입니다.'
                            : (
                                messageEdits[message.id] ??
                                message.text
                              )}
                        </button>

                        <small>
                          {formatChatTime(
                            message.createdAt,
                          )}
                        </small>
                      </div>

                      {menu === message.id &&
                        !message.isDeleted && (
                          <div
                            className={`${s.messageMenu} ${
                              !message.canDelete
                                ? s.reportMenu
                                : ''
                            }`}
                          >
                            {message.canDelete ? (
                              <>
                                {canSendMessage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessage(
                                        message.id,
                                      );

                                      setInput(
                                        messageEdits[
                                          message.id
                                        ] ?? message.text,
                                      );

                                      setMenu(null);

                                      requestAnimationFrame(
                                        () =>
                                          composerRef.current?.focus(),
                                      );
                                    }}
                                  >
                                    수정하기
                                  </button>
                                )}

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
                                onSendMessage={
                                  sendPrivateMessage
                                }
                                onReport={() =>
                                  report(
                                    'CHAT_MESSAGE',
                                    message.id,
                                  )
                                }
                              />
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!canSendMessage && (
              <p className={s.chatEnded}>
                {!radio.isAuthenticated
                  ? '로그인 후 이용 가능합니다.'
                  : chatScheduled
                    ? '아직 채팅방이 열리지 않았어요.'
                    : '현재 메시지를 전송할 수 없는 방입니다.'}
              </p>
            )}

            <div ref={chatEndRef} />
          </div>

          {canSendMessage && (
            <div className={s.composerWrap}>
              {composer(
                sendMessage,
                '채팅',
                '메시지를 입력해주세요',
              )}
            </div>
          )}
        </div>
      )}

      {loginModalOpen && (
        <LoginRequiredModal
          onClose={() => setLoginModalOpen(false)}
          onLogin={handleLogin}
        />
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
            <img
              className={s.fullImage}
              src={modal.image}
              alt="첨부 사진 확대"
            />
          ) : modal.type === 'report' ? (
            <form onSubmit={submitReport}>
              <h2>신고 사유를 선택해 주세요.</h2>

              {error && (
                <p
                  role="alert"
                  className={s.errorNotice}
                >
                  {error}
                </p>
              )}

              <fieldset className={s.reasons}>
                <legend className={s.srOnly}>
                  신고 사유
                </legend>

                {REPORT_REASONS.map((item) => (
                  <label key={item.value}>
                    <input
                      type="radio"
                      name="reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={() =>
                        setReason(item.value)
                      }
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
                  onChange={(event) =>
                    setOtherReason(event.target.value)
                  }
                />
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
              <img
                src={reportSiren}
                className={s.reportSiren}
                width={32}
                height={32}
                alt=""
                aria-hidden="true"
              />

              <h2>신고 완료</h2>

              <p className={s.muted}>
                신고된 내용은 검토후 조치할 예정입니다.
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

              {error && (
                <p
                  role="alert"
                  className={s.errorNotice}
                >
                  {error}
                </p>
              )}

              <p className={s.muted}>
                {modal.type === 'deletePost'
                  ? '삭제된 글은 복구할 수 없습니다.'
                  : '삭제된 내용은 복구할 수 없습니다.'}
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
                    if (!requireLogin()) return;

                    try {
                      if (modal.type === 'deletePost') {
                        radio.deletePost(post.id);
                        backToBoard();
                      }

                      if (
                        modal.type === 'deleteComment'
                      ) {
                        radio.deleteComment(
                          post.id,
                          modal.id,
                        );
                      }

                      if (
                        modal.type === 'deleteMessage'
                      ) {
                        radio.deleteMessage(
                          race.id,
                          modal.id,
                        );
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