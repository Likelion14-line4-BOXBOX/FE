import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import LoginGuide from "../../components/common/LoginGuide/LoginGuide";
import useTeamRadioData from "../TeamRadio/useTeamRadioData";
import {
  formatKoreanDate,
  formatPostDate,
} from "../TeamRadio/radioModel";

import garageLogo from "../../assets/images/mygarage/My Garage.svg";
import s from "./MyRadio.module.scss";

const ITEMS = [
  { id: "posts", label: "내가 작성한 글" },
  { id: "comments", label: "내가 작성한 댓글" },
  { id: "likes", label: "좋아요" },
  { id: "scraps", label: "스크랩" },
];

function ArrowIcon({ back = false }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          back
            ? "M13.5 5.5 8 11l5.5 5.5"
            : "m8.5 5.5 5.5 5.5-5.5 5.5"
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PostCounts({ post }) {
  return (
    <span className={s.counts}>
      <span aria-label={`좋아요 ${post.likeCount}개`}>
        <svg
          width="16"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>

        {post.likeCount}
      </span>

      <span aria-label={`댓글 ${post.commentCount}개`}>
        <svg
          width="16"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 3h16v14H9l-5 4V3Z" />
        </svg>

        {post.commentCount}
      </span>
    </span>
  );
}

export default function MyRadio({
  currentUser = null,
  onLogin,
}) {
  const [params] = useSearchParams();
  const location = useLocation();

  const { posts, boards } = useTeamRadioData({
    currentUser,
  });

  const selected = ITEMS.find(
    (item) => item.id === params.get("tab"),
  );

  const userId = currentUser?.userId;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!userId) {
    return (
      <LoginGuide
        logoSrc={garageLogo}
        logoAlt="My Garage"
        onLogin={onLogin}
      />
    );
  }

  const filtered = selected
    ? posts
        .filter((post) => {
          switch (selected.id) {
            case "posts":
              return post.authorProfile?.userId === userId;

            case "comments":
              // 댓글을 여러 번 작성해도 게시글은 한 번만 표시됩니다.
              return post.comments.some(
                (comment) =>
                  !comment.isDeleted &&
                  comment.author?.userId === userId,
              );

            case "likes":
              return post.liked === true;

            case "scraps":
              return post.saved === true;

            default:
              return false;
          }
        })
        .sort(
          (a, b) =>
            Date.parse(b.createdAt) -
            Date.parse(a.createdAt),
        )
    : [];

  function isArchive(post) {
    return (
      boards.find(
        (board) => board.id === post.boardId,
      )?.type === "ARCHIVE"
    );
  }

  return (
    <section className={s.page}>
      <header className={s.header}>
        <Link
          className={s.back}
          to={
            selected
              ? "/my-garage/radio"
              : "/my-garage"
          }
          aria-label="뒤로가기"
        >
          <ArrowIcon back />
        </Link>

        <h1>
          {selected?.label ?? "마이 라디오"}
        </h1>

        <span aria-hidden="true" />
      </header>

      {!selected ? (
        <nav
          className={s.menu}
          aria-label="마이 라디오 메뉴"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.id}
              className={s.menuItem}
              to={`/my-garage/radio?tab=${item.id}`}
            >
              <span>{item.label}</span>
              <ArrowIcon />
            </Link>
          ))}
        </nav>
      ) : filtered.length ? (
        <ul className={s.list}>
          {filtered.map((post) => (
            <li key={post.id}>
              <Link
                className={s.post}
                to={{
                  pathname: "/team-radio",
                  search: `?${new URLSearchParams({
                    view: "post",
                    board: post.boardId,
                    post: post.id,
                  })}`,
                }}
                state={{
                  myRadioReturnTo:
                    location.pathname + location.search,
                }}
              >
                <span className={s.tag}>
                  {isArchive(post)
                    ? "미사용태그"
                    : post.tag}
                </span>

                <strong className={s.title}>
                  {post.title}
                </strong>

                <span className={s.meta}>
                  <span>
                    {post.author} ·{" "}
                    {isArchive(post)
                      ? formatKoreanDate(post.createdAt)
                      : formatPostDate(post.createdAt, now)}
                  </span>

                  <PostCounts post={post} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.empty}>
          {selected.id === "posts"
            ? "아직 작성한 게시글이 없습니다."
            : selected.id === "comments"
              ? "아직 댓글을 작성한 게시글이 없습니다."
              : selected.id === "likes"
                ? "아직 좋아요한 게시글이 없습니다."
                : "아직 스크랩한 게시글이 없습니다."}
        </p>
      )}
    </section>
  );
}