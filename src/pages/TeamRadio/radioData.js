import { TEAM_ROSTER } from "../../shared/teamRoster";
import boardSeedText from "./게시판목업.txt?raw";

const boardSeed = [
  ...boardSeedText.matchAll(/```json\s*([\s\S]*?)```/g),
].flatMap((match) => JSON.parse(match[1]));

export const teams = [
  ["mercedes", "메르세데스", "#00cdb1", "메르세데스"],
  ["ferrari", "페라리", "#ed0035", "페라리"],
  ["redbull", "레드불 레이싱", "#3977d8", "레드불"],
  ["mclaren", "맥라렌", "#ff8c19", "맥라렌"],
  ["racingbulls", "레이싱 불스", "#4168ee", "레이싱불스"],
  ["alpine", "알핀", "#31a4d4", "알핀"],
  ["haas", "하스", "#aebbbb", "하스"],
  ["audi", "아우디", "#f43312", "아우디"],
  ["williams", "윌리엄스", "#367ae1", "윌리엄스"],
  ["aston", "애스턴 마틴", "#1fa77e", "애스턴 마틴"],
  ["cadillac", "캐딜락", "#858585", "캐딜락"],
].map(([id, name, color, asset]) => ({
  id,
  name,
  color,
  asset,
  tags: [
    "전체",
    name,
    ...(TEAM_ROSTER.find((team) => team.name === name)
      ?.drivers ?? []),
  ],
  banner: `${asset}_배너.svg`,
}));

export const boards = [
  ...teams,
  {
    id: "free",
    name: "자유 게시판",
    description: "수다 · 공구 · 단체 관람 · 친구",
    tags: ["전체", "굿즈", "레이스", "친목", "질문", "공구"],
  },
  {
    id: "beginner",
    name: "입문자 게시판",
    description: "꿀팁 정보 · 고인물에게 질문하기",
    tags: ["전체", "입문자", "고인물", "친목", "질문", "정보"],
  },
  {
    id: "archive",
    name: "Archive",
    tags: ["전체"],
  },
];

// 기존 목업 화면을 위한 데이터.
// 실제 채팅 화면에서는 서버의 채팅방 목록을 사용합니다.
export const races = [
  {
    id: "mexico",
    title: "멕시코시티 그랑프리",
    status: "scheduled",
    remaining: "2일 3시간 40분",
    round: 19,
    sessions: [
      {
        id: "fp2",
        name: "프리 프랙티스 2",
        startsAt: "2026-10-31T07:00:00+09:00",
        endsAt: "2026-10-31T08:00:00+09:00",
      },
    ],
  },
  {
    id: "usa",
    title: "미국 그랑프리",
    status: "closed",
    round: 18,
  },
  {
    id: "singapore",
    title: "싱가포르 그랑프리",
    status: "closed",
    round: 17,
  },
  {
    id: "bahrain",
    title: "바레인 그랑프리",
    status: "closed",
    round: 16,
  },
  {
    id: "azerbaijan",
    title: "아제르바이잔 그랑프리",
    status: "closed",
    round: 15,
  },
  {
    id: "spain",
    title: "스페인 그랑프리",
    status: "closed",
    round: 14,
  },
];

const normalize = (value) =>
  String(value)
    .replace(/\s/g, "")
    .replace("레드불레이싱", "레드불");

const aliases = {
  "샤를 르클레르": "샤를 르끌레르",
  "알렉스 알본": "알렉산더 알본",
  "아르비드 린드블라드": "아비드 린드블라드",
  "세르히오 페레스": "세르히오 페레즈",
};

const seedTime = Date.UTC(2026, 10, 1);

const seededPosts = boardSeed.map((post, index) => {
  const teamName = post.boardI.match(/\((.*?)\)/)?.[1];

  const board = teamName
    ? teams.find(
        (team) =>
          normalize(team.name) === normalize(teamName),
      )
    : boards.find(
        (item) =>
          item.id ===
          (post.boardI === "자유" ? "free" : "beginner"),
      );

  if (!board) {
    throw new Error(
      `목업 게시판 매핑 누락: ${post.boardI}`,
    );
  }

  const tag =
    aliases[post.tagId] ??
    board.tags.find(
      (item) =>
        normalize(item) === normalize(post.tagId),
    ) ??
    post.tagId;

  if (tag !== "전체" && !board.tags.includes(tag)) {
    board.tags.push(tag);
  }

  return {
    id: `seed-${board.id}-${index + 1}`,
    boardId: board.id,
    tag,
    title: post.title,
    body: post.content,
    author: post.nickname,
    mine: false,
    likes: 0,
    liked: false,
    saved: false,
    createdAt: seedTime - index * 60_000,
    images: [],
    comments: (post.comments ?? []).map(
      (comment, commentIndex) => ({
        id: `seed-${index + 1}-comment-${commentIndex + 1}`,
        author: comment.nickname,
        text: comment.content,
        mine: false,
        createdAt:
          seedTime -
          index * 60_000 +
          (commentIndex + 1) * 1000,
      }),
    ),
  };
});

// 아카이브는 기존 샘플 유지
const archivePosts = Array.from(
  { length: 6 },
  (_, index) => ({
    id: `archive-${index}`,
    boardId: "archive",
    tag: "미사용태그",
    title:
      index === 1
        ? "루이스 이야기 함께 나눠요"
        : "게시글 제목 게시글 제목 게시글",
    body:
      "글 내용 글 내용 글 내용 글 내용 글 내용 글 내용\n" +
      "팀 라디오에서 함께 이야기를 나눠요.",
    author: "닉네임",
    mine: false,
    likes: 5,
    liked: false,
    saved: false,
    date: "10/30 12:14",
    createdAt: Date.UTC(
      index < 3 ? 2025 : 2024,
      11,
      2 - (index % 3),
    ),
    images: [],
    comments: [
      {
        id: `archive-${index}-comment`,
        text: "댓글 댓글 댓글 댓글",
        mine: false,
      },
    ],
  }),
);

export const initialPosts = [
  ...seededPosts,
  ...archivePosts,
];

// 실제 채팅과 목업 메시지를 섞지 않습니다.
export const initialMessages = [];