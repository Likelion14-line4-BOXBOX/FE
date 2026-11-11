// 퍼블리싱 확인용 데이터
export const teams = [
  [
    'mercedes',
    '메르세데스',
    '#00cdb1',
    '메르세데스',
    '조지 러셀',
    '키미 안토넬리',
  ],
  ['ferrari', '페라리', '#ed0035', '페라리'],
  ['redbull', '레드불 레이싱', '#3977d8', '레드불'],
  ['mclaren', '맥라렌', '#ff8c19', '맥라렌'],
  ['racingbulls', '레이싱 불스', '#4168ee', '레이싱불스'],
  ['alpine', '알핀', '#31a4d4', '알핀'],
  ['haas', '하스', '#aebbbb', '하스'],
  ['audi', '아우디', '#f43312', '아우디'],
  ['williams', '윌리엄스', '#367ae1', '윌리엄스'],
  ['aston', '애스턴 마틴', '#1fa77e', '애스턴 마틴'],
  ['cadillac', '캐딜락', '#858585', '캐딜락'],
].map(([id, name, color, asset, ...drivers]) => ({
  id,
  name,
  color,
  asset,
  tags: ['전체', name, ...drivers],

  // 완성된 배너를 src/assets/images/teamradio/에 넣고 파일명을 지정하세요.
  banner: null,
}));

export const boards = [
  ...teams,
  {
    id: 'free',
    name: '자유 게시판',
    description: '수다 · 공구 · 단체 관람 · 친구',
    tags: ['전체', '굿즈', '레이스', '친목', '질문', '공구'],
  },
  {
    id: 'beginner',
    name: '입문자 게시판',
    description: '꿀팁 정보 · 고인물에게 질문하기',
    tags: ['전체', '입문자', '고인물', '친목', '질문', '정보'],
  },
  {
    id: 'archive',
    name: 'Archive',
    tags: ['전체'],
  },
];

export const races = [
  {
    id: 'mexico',
    title: '멕시코시티 그랑프리',
    status: 'scheduled',
    remaining: '2일 3시간 40분',
    round: 19,
  },
  { id: 'usa', title: '미국 그랑프리', status: 'closed', round: 18 },
  { id: 'singapore', title: '싱가포르 그랑프리', status: 'closed', round: 17 },
  { id: 'bahrain', title: '바레인 그랑프리', status: 'closed', round: 16 },
  {
    id: 'azerbaijan',
    title: '아제르바이잔 그랑프리',
    status: 'closed',
    round: 15,
  },
  { id: 'spain', title: '스페인 그랑프리', status: 'closed', round: 14 },
];

export const initialPosts = boards.flatMap((board) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${board.id}-${index}`,
    boardId: board.id,
    tag:
      board.tags[1 + (index % Math.max(1, board.tags.length - 1))] ||
      '미사용태그',
    title:
      index === 1
        ? '루이스 이야기 함께 나눠요'
        : '게시글 제목 게시글 제목 게시글',
    body:
      '글 내용 글 내용 글 내용 글 내용 글 내용 글 내용\n' +
      '팀 라디오에서 함께 이야기를 나눠요.',
    author: '닉네임',
    mine: false,
    likes: 5,
    liked: false,
    saved: false,
    date: '10/30 12:14',
    createdAt: Date.now() - (index + 1) * 86400000,
    images: [],
    comments: [
      {
        id: `${board.id}-${index}-comment`,
        text: '댓글 댓글 댓글 댓글',
        mine: false,
      },
    ],
  })),
);

export const initialMessages = [
  { id: 'a', text: '메세지메세지메세지메세지', mine: false },
  { id: 'b', text: '메세지메세지메세지', mine: false },
  { id: 'c', text: '메세지', mine: false },
  { id: 'd', text: '내 메시지', mine: true },
];