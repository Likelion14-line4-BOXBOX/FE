import { useState } from "react";
import { Link } from "react-router-dom";

import logo from "../../assets/images/logo.svg";
import trackMexico from "../../assets/images/home/track-mexico.svg";
import watchAd from "../../assets/images/home/watch.svg";
import kitkatAd from "../../assets/images/home/kitkat.svg";
import capAd from "../../assets/images/home/cap.svg";

import LoginRequiredModal from "../../components/common/LoginRequiredModal/LoginRequiredModal";
import useTeamRadioData from "../TeamRadio/useTeamRadioData";

import styles from "./Home.module.scss";

const nextRace = {
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

export default function Home({
  currentUser = null,
  // 현재 샘플 알림 수입니다. API 연동 후 실제 값을 전달하세요.
  unreadCount = 0,
  onLogin,
  onOpenMessages,
}) {
  const [product] = useState(
    () => products[Math.floor(Math.random() * products.length)],
  );

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const { posts, boards } = useTeamRadioData({
    currentUser,
  });

  const isAuthenticated = Boolean(currentUser?.userId);

  // 비회원이면 전달된 알림 수와 관계없이 표시하지 않습니다.
  const unread = isAuthenticated
    ? Math.max(0, Math.floor(Number(unreadCount) || 0))
    : 0;

  // 아카이브를 제외한 게시글 중 최신 3개
  const latestPosts = [...posts]
    .filter((post) => post.boardId !== "archive")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  function getBoardName(boardId) {
    const board = boards.find(
      (item) => item.id === boardId,
    );

    if (!board) return "게시판";

    return board.type === "TEAM"
      ? `${board.name} 게시판`
      : board.name;
  }

  function handleMailClick() {
    setNotice("");

    if (isAuthenticated) return;

    setLoginModalOpen(true);
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
      {/* 헤더 */}
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
        <p
          role="status"
          className={styles.notice}
        >
          {notice}
        </p>
      )}

      <div className={styles.body}>
        {/* 다음 레이스 */}
        <section className={styles.raceCard}>
          <span className={styles.dday}>
            {nextRace.dday}
          </span>

          <div className={styles.raceInfo}>
            <div className={styles.track}>
              <img
                src={nextRace.trackImg}
                alt={`${nextRace.name} 서킷`}
                className={styles.trackImg}
              />
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

        {/* 상품 광고 */}
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

        {/* TEAM RADIO */}
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
                key={post.id}
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
                    }).toString()}`,
                  }}
                >
                  <p className={styles.board}>
                    {getBoardName(post.boardId)}
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

                      {post.likeCount}
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