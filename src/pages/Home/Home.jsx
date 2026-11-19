import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo.svg";
import trackMexico from "../../assets/images/home/track-mexico.svg";
import watchAd from "../../assets/images/home/watch.svg";
import kitkatAd from "../../assets/images/home/kitkat.svg";
import capAd from "../../assets/images/home/cap.svg";

import LoginRequiredModal from "../../components/common/LoginRequiredModal/LoginRequiredModal";
import useTeamRadioData from "../TeamRadio/useTeamRadioData";
import useHomeData, { HOME_API_ENABLED } from "./useHomeData";

import { displayName } from "../../api/myGarageApi";
import { useGarageProfile } from "../../shared/garageProfile";

import styles from "./Home.module.scss";

const mockNextRace = {
  dday: "D-2",
  round: "R19",
  name: "멕시코시티 그랑프리",
  period: "10.31 - 11.1",
  trackImg: trackMexico,
  session: {
    name: "프리 프랙티스1",
    time: "10.31 토 03:30",
    remaining: "2일 17시간 20분 남음",
  },
};

const products = [
  {
    name: "태그호이어 커넥티드 칼리버 E5 x 포뮬러 1 에디션",
    spec: "45 mm, 블랙 DLC 코팅 그레이드 2 티타늄",
    img: watchAd,
    url: "https://www.tagheuer.com/kr/ko/스마트-워치/컬렉션/태그호이어-커넥티드/45-mm/SBT8A85.EB0417.html",
  },
  {
    name: "킷캣 F1 (10개입)",
    spec: "Have a break, have a kitkat",
    img: kitkatAd,
    url: "https://brand.naver.com/nestlestore/products/13746101954",
  },
  {
    name: "메르세데스 - AMG F1 팀 DNA 3-스트라이프 캡",
    spec: "Mercedes AMG Petronas Formula One Team",
    img: capAd,
    url: "https://www.adidas.co.kr/메르세데스---amg-f1-팀-dna-3-스트라이프-캡/KS8851.html",
  },
];

const TIME_ZONE = "Asia/Seoul";

const circuitImages = import.meta.glob(
  "../../assets/images/home/*.svg",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateParts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function formatMonthDay(value) {
  const date = parseDate(value);

  if (!date) return "일정 미정";

  const parts = getDateParts(date);

  return `${Number(parts.month)}.${Number(parts.day)}`;
}

function formatPeriod(startsAt, endsAt) {
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);

  if (!start && !end) return "일정 미정";
  if (!start) return formatMonthDay(endsAt);
  if (!end) return formatMonthDay(startsAt);

  const startParts = getDateParts(start);
  const endParts = getDateParts(end);

  const sameDay =
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.day === endParts.day;

  return sameDay
    ? formatMonthDay(startsAt)
    : `${formatMonthDay(startsAt)} - ${formatMonthDay(endsAt)}`;
}

function formatSessionTime(value) {
  const date = parseDate(value);

  if (!date) return "일정 미정";

  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return `${formatMonthDay(value)} ${weekday} ${time}`;
}

function getDday(value, now) {
  const target = parseDate(value);

  if (!target) return "일정 미정";

  const targetParts = getDateParts(target);
  const todayParts = getDateParts(new Date(now));

  const targetDay = Date.UTC(
    Number(targetParts.year),
    Number(targetParts.month) - 1,
    Number(targetParts.day),
  );

  const today = Date.UTC(
    Number(todayParts.year),
    Number(todayParts.month) - 1,
    Number(todayParts.day),
  );

  const days = Math.round((targetDay - today) / 86_400_000);

  if (days === 0) return "D-DAY";

  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

function getRemaining(value, now) {
  const target = parseDate(value);

  if (!target) return "일정 미정";

  const difference = target.getTime() - now;

  if (difference <= 0) return "시작 시간 지남";
  if (difference < 60_000) return "곧 시작";

  const totalMinutes = Math.ceil(difference / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    days > 0 ? `${days}일` : "",
    hours > 0 ? `${hours}시간` : "",
    `${minutes}분 남음`,
  ]
    .filter(Boolean)
    .join(" ");
}

function getCircuitImage(race) {
  if (!race) return null;

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "");
  }

  function findImage(filename) {
    const entry = Object.entries(circuitImages).find(
      ([path]) =>
        path.split("/").pop().normalize("NFC") ===
        filename.normalize("NFC"),
    );

    return entry?.[1] ?? null;
  }

  const circuits = [
    {
      file: "호주.svg",
      aliases: [
        "australia",
        "melbourne",
        "albert park",
        "호주",
        "멜버른",
      ],
    },
    {
      file: "중국.svg",
      aliases: ["china", "chinese", "shanghai", "중국", "상하이"],
    },
    {
      file: "일본.svg",
      aliases: ["japan", "japanese", "suzuka", "일본", "스즈카"],
    },
    {
      file: "바레인.svg",
      aliases: ["bahrain", "sakhir", "바레인", "사키르"],
    },
    {
      file: "마이애미.svg",
      aliases: ["miami", "마이애미"],
    },
    {
      file: "캐나다.svg",
      aliases: [
        "canada",
        "canadian",
        "montreal",
        "gilles villeneuve",
        "캐나다",
        "몬트리올",
        "질 빌뇌브",
      ],
    },
    {
      file: "모나코.svg",
      aliases: ["monaco", "monte carlo", "모나코", "몬테카를로"],
    },
    {
      file: "바르셀로나.svg",
      aliases: ["barcelona", "catalunya", "바르셀로나", "카탈루냐"],
    },
    {
      file: "오스트리아.svg",
      aliases: [
        "austria",
        "austrian",
        "spielberg",
        "red bull ring",
        "오스트리아",
        "슈필베르크",
        "레드불 링",
      ],
    },
    {
      file: "영국.svg",
      aliases: ["britain", "british", "silverstone", "영국", "실버스톤"],
    },
    {
      file: "벨기에.svg",
      aliases: [
        "belgium",
        "belgian",
        "spa francorchamps",
        "벨기에",
        "스파",
      ],
    },
    {
      file: "헝가리.svg",
      aliases: [
        "hungary",
        "hungarian",
        "hungaroring",
        "헝가리",
        "헝가로링",
      ],
    },
    {
      file: "네덜란드.svg",
      aliases: [
        "netherlands",
        "dutch",
        "zandvoort",
        "네덜란드",
        "잔드보르트",
      ],
    },
    {
      file: "이탈리아.svg",
      aliases: ["italy", "italian", "monza", "이탈리아", "몬차", "몬자"],
    },
    {
      file: "스페인.svg",
      aliases: ["madrid", "madring", "마드리드", "마드링"],
    },
    {
      file: "아제르 바이잔.svg",
      aliases: ["azerbaijan", "baku", "아제르바이잔", "바쿠"],
    },
    {
      file: "싱가포르.svg",
      aliases: [
        "singapore",
        "marina bay",
        "싱가포르",
        "싱가폴",
        "마리나 베이",
      ],
    },
    {
      file: "미국 서킷.svg",
      aliases: [
        "united states",
        "austin",
        "circuit of the americas",
        "cota",
        "미국",
        "오스틴",
        "아메리카스",
      ],
    },
    {
      file: "멕시코시티.svg",
      aliases: [
        "mexico",
        "hermanos rodriguez",
        "멕시코",
        "에르마노스 로드리게스",
      ],
    },
    {
      file: "상파울루.svg",
      aliases: [
        "sao paulo",
        "brazil",
        "brazilian",
        "interlagos",
        "jose carlos pace",
        "상파울루",
        "브라질",
        "인터라고스",
      ],
    },
    {
      file: "라스베이거스.svg",
      aliases: ["las vegas", "라스베이거스", "라스베가스"],
    },
    {
      file: "카타르.svg",
      aliases: [
        "qatar",
        "lusail",
        "losail",
        "카타르",
        "루사일",
        "로사일",
      ],
    },
    {
      file: "아부다비.svg",
      aliases: ["abu dhabi", "yas marina", "아부다비", "야스 마리나"],
    },
  ];

  function matchCircuit(value) {
    const text = normalize(value);

    if (!text) return null;

    return circuits.find(({ aliases }) =>
      aliases.some((alias) => {
        const keyword = normalize(alias);

        return keyword.length > 0 && text.includes(keyword);
      }),
    );
  }

  // 국가명 대신 서킷명·경기명으로 같은 국가의 경기장을 구분
  const circuit =
    matchCircuit(race.circuitName) ??
    matchCircuit(race.name) ??
    matchCircuit(race.nameEn) ??
    matchCircuit(race.circuitKey);

  if (circuit) {
    return findImage(circuit.file);
  }

  if (race.circuitKey != null) {
    return findImage(`track-${race.circuitKey}.svg`);
  }

  return null;
}

function makeRaceCard(homeData, now) {
  const race = homeData.nextRace;
  const session = homeData.nextSession;

  if (!race) {
    return {
      dday: "일정 없음",
      round: "—",
      name: "예정된 경기가 없습니다",
      period: "다음 경기 일정 준비 중",
      trackImg: null,
      session: {
        name: "예정된 세션이 없습니다",
        time: "—",
        remaining: "—",
      },
    };
  }

  return {
    dday: getDday(race.weekendStartsAt ?? race.scheduledStartAt, now),
    round: race.roundNumber == null ? "—" : `R${race.roundNumber}`,
    name: race.name,
    period: formatPeriod(race.weekendStartsAt, race.weekendEndsAt),
    trackImg: getCircuitImage(race),
    session: {
      name: session?.name ?? "예정된 세션이 없습니다",
      time: session ? formatSessionTime(session.startsAt) : "—",
      remaining: session ? getRemaining(session.startsAt, now) : "—",
    },
  };
}

function getPostTime(post) {
  const time = Date.parse(post.createdAt);

  return Number.isFinite(time) ? time : 0;
}

function sortLatest(a, b) {
  return getPostTime(b) - getPostTime(a);
}

export default function Home({
  currentUser = null,
  accessToken = null,
  unreadCount = 0,
  onLogin,
  onOpenMessages,
}) {
  const navigate = useNavigate();
  const garageProfile = useGarageProfile();

  const [product] = useState(
    () => products[Math.floor(Math.random() * products.length)],
  );

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const { posts, boards } = useTeamRadioData({
    currentUser,
  });

  // 홈 API는 경기 카드 데이터에만 사용
  const { data: homeData } = useHomeData({ accessToken });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // API 응답 전에는 경기 목업을 표시하지 않음
  const nextRace = HOME_API_ENABLED
    ? homeData
      ? makeRaceCard(homeData, now)
      : null
    : mockNextRace;

  const isAuthenticated = Boolean(currentUser?.userId);

  const unread = isAuthenticated
    ? Math.max(0, Math.floor(Number(unreadCount) || 0))
    : 0;

  // 게시글은 기존 목업·로컬 데이터만 사용
  const localPosts = posts
    .filter((post) => post.boardId !== "archive")
    .map((post) => ({
      ...post,
      id: String(post.id),
      boardId: String(post.boardId),
      source: "local",
    }))
    .sort(sortLatest);

  const favoriteTeamName = displayName(
  isAuthenticated && garageProfile.userId === currentUser.userId
    ? garageProfile.team
    : currentUser?.favoriteTeam?.name,
);

const myTeamBoard = isAuthenticated && boards.find(
  (board) => board.type === "TEAM" && board.name === favoriteTeamName,
);

const previewBoardIds = [
  myTeamBoard?.id,
  boards.find((board) => board.type === "FREE")?.id,
  boards.find((board) => board.type === "BEGINNER")?.id,
];

const latestPosts = previewBoardIds.flatMap((boardId) => {
  if (boardId == null) return [];

  const latest = localPosts.find((post) => post.boardId === String(boardId));
  return latest ? [latest] : [];
});

  function getBoardName(boardId) {
    const board = boards.find(
      (item) => String(item.id) === String(boardId),
    );

    if (!board) return "게시판";

    return board.type === "TEAM"
      ? `${board.name} 게시판`
      : board.name;
  }

  function handleMailClick() {
    setNotice("");

    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    if (onOpenMessages) {
      onOpenMessages();
      return;
    }

    navigate("/messages");
  }

  function handleLogin() {
    setLoginModalOpen(false);

    if (!onLogin) {
      setNotice("로그인 화면이 아직 연결되지 않았어요.");
      return;
    }

    onLogin();
  }

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <img
          src={logo}
          alt="BOX BOX"
          className={styles.logo}
        />

        <button
          type="button"
          className={styles.mail}
          aria-label="메시지함"
          onClick={handleMailClick}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
            />
            <path d="m3 7 9 6 9-6" />
          </svg>

          {unread > 0 && (
            <span className={styles.badge}>
              {unread}
            </span>
          )}
        </button>
      </header>

      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}

      <div className={styles.body}>
        {nextRace && (
          <section className={styles.raceCard}>
            <span className={styles.dday}>
              {nextRace.dday}
            </span>

            <div className={styles.raceInfo}>
              <div className={styles.track}>
                {nextRace.trackImg && (
                  <img
                    src={nextRace.trackImg}
                    alt={`${nextRace.name} 서킷`}
                    className={styles.trackImg}
                  />
                )}
              </div>

              <div>
                <p className={styles.round}>
                  {nextRace.round}
                </p>

                <h2 className={styles.raceName}>
                  {nextRace.name}
                </h2>

                <p className={styles.period}>
                  {nextRace.period}
                </p>
              </div>
            </div>

            <div className={styles.session}>
              <div>
                <p className={styles.sessionName}>
                  {nextRace.session.name}
                </p>

                <p className={styles.sessionTime}>
                  {nextRace.session.time}
                </p>
              </div>

              <p className={styles.remaining}>
                {nextRace.session.remaining}
              </p>
            </div>
          </section>
        )}

        <section className={styles.productCard}>
          <img
            src={product.img}
            alt={product.name}
            className={styles.productImg}
          />

          <div className={styles.productBody}>
            <p className={styles.productName}>
              {product.name}
            </p>

            <p className={styles.productSpec}>
              {product.spec}
            </p>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.productLink}
              aria-label={`${product.name} 구매하기 (새 탭에서 열림)`}
            >
              구매하기
            </a>
          </div>
        </section>

        <section className={styles.radio}>
          <div className={styles.radioHead}>
            <h2 className={styles.radioTitle}>
              TEAM RADIO
            </h2>

            <Link
              to="/team-radio"
              className={styles.more}
            >
              더보기

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </div>

          {latestPosts.length === 0 && (
            <p className={styles.empty}>
              아직 게시글이 없습니다.
            </p>
          )}

          <ul className={styles.postList}>
            {latestPosts.map((post) => (
              <li
                key={`${post.source}-${post.id}`}
                className={styles.postItem}
              >
                <Link
                  className={styles.postLink}
                  to={{
                    pathname: "/team-radio",
                    search: `?${new URLSearchParams({
                      view: "post",
                      board: post.boardId,
                      post: post.id,
                      source: post.source,
                    }).toString()}`,
                  }}
                >
                  <p className={styles.board}>
                    {post.boardName ?? getBoardName(post.boardId)}
                  </p>

                  <div className={styles.postRow}>
                    <p className={styles.postTitle}>
                      {post.title}
                    </p>

                    <span className={styles.likes}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
                      </svg>

                      {post.likeCount ?? 0}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {loginModalOpen && (
        <LoginRequiredModal
          onClose={() => setLoginModalOpen(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}