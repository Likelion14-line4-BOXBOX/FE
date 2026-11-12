export const drivers = [
    { name: "랜도 노리스", team: "맥라렌", startPrice: 50000, change: 1, volume: 200 },
    { name: "막스 베르스타펜", team: "레드불 레이싱", startPrice: 42000, change: 0, volume: 180 },
    { name: "샤를 르클레르", team: "페라리", startPrice: 36000, change: 0, volume: 160 },
    { name: "조지 러셀", team: "메르세데스", startPrice: 31000, change: 1, volume: 150 },
    { name: "오스카 피아스트리", team: "맥라렌", startPrice: 27000, change: 1, volume: 140 },
    { name: "올리버 베어먼", team: "하스", startPrice: 24000, change: 0, volume: 130 },
    { name: "루이스 해밀턴", team: "페라리", startPrice: 21500, change: 1, volume: 120 },
    { name: "키미 안토넬리", team: "메르세데스", startPrice: 19500, change: 0, volume: 110 },
    { name: "리암 로슨", team: "레이싱 불스", startPrice: 17500, change: 0, volume: 100 },
    { name: "알렉산더 알본", team: "윌리엄스", startPrice: 16000, change: 0, volume: 90 },
    { name: "카를로스 사인츠", team: "윌리엄스", startPrice: 14500, change: 0, volume: 80 },
    { name: "페르난도 알론소", team: "애스턴 마틴", startPrice: 13000, change: 0, volume: 70 },
    { name: "랜스 스트롤", team: "애스턴 마틴", startPrice: 12000, change: 0, volume: 60 },
    { name: "피에르 가슬리", team: "알핀", startPrice: 11000, change: 0, volume: 50 },
    { name: "아이작 하자르", team: "레드불 레이싱", startPrice: 10000, change: 0, volume: 45 },
    { name: "니코 휠켄베르크", team: "아우디", startPrice: 9000, change: 0, volume: 40 },
    { name: "가브리엘 보르톨레토", team: "아우디", startPrice: 8000, change: 0, volume: 35 },
    { name: "프랑코 콜라핀토", team: "알핀", startPrice: 7000, change: 0, volume: 30 },
    { name: "라파엘 카마라", team: "하스", startPrice: 6000, change: 0, volume: 25 },
    { name: "아비드 린드블라드", team: "레이싱 불스", startPrice: 5000, change: 0, volume: 20 },
    { name: "세르히오 페레즈", team: "캐딜락", startPrice: 4000, change: 0, volume: 15 },
    { name: "발테리 보타스", team: "캐딜락", startPrice: 3000, change: 0, volume: 10 },
];

export function getMockPrice({ startPrice, change }) {
    return Math.round(startPrice * (1 + change / 100));
}