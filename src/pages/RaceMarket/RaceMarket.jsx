import { useSearchParams } from "react-router-dom";
import logo from "../../assets/images/racemarket/race-market-logo.svg";
import increaseIcon from "../../assets/images/racemarket/red-increase.svg";
import styles from "./RaceMarket.module.scss";

const round = {
  number: 19,
  name: "멕시코시티 그랑프리",
  timeUntilClose: "5일 3시간 40분",
};

const drivers = [
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
  { name: "이삭 하자르", team: "레드불 레이싱", startPrice: 10000, change: 0, volume: 45 },
  { name: "니코 휠켄베르크", team: "아우디", startPrice: 9000, change: 0, volume: 40 },
  { name: "가브리엘 보르톨레토", team: "아우디", startPrice: 8000, change: 0, volume: 35 },
  { name: "프랑코 콜라핀토", team: "알핀", startPrice: 7000, change: 0, volume: 30 },
  { name: "라파엘 카마라", team: "하스", startPrice: 6000, change: 0, volume: 25 },
  { name: "아비드 린드블라드", team: "레이싱 불스", startPrice: 5000, change: 0, volume: 20 },
  { name: "세르히오 페레즈", team: "캐딜락", startPrice: 4000, change: 0, volume: 15 },
  { name: "발테리 보타스", team: "캐딜락", startPrice: 3000, change: 0, volume: 10 },
];

const formatNumber = new Intl.NumberFormat("ko-KR");

export default function RaceMarket() {
  const [searchParams] = useSearchParams();
  const isClosed = searchParams.get("preview") === "closed";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1><img src={logo} alt="Race Market" /></h1>
        <div className={styles.tabs} aria-label="레이스마켓 메뉴">
          <span className={styles.activeTab} aria-current="page">
            {isClosed ? "드라이버 랭킹" : "드라이버"}
          </span>
          <button type="button" disabled>유저 랭킹</button>
          <button type="button" disabled>마이</button>
        </div>
      </header>

      <div className={styles.content}>
        <section
          className={isClosed ? `${styles.round} ${styles.closed}` : styles.round}
          aria-labelledby="market-round-title"
        >
          <span className={styles.badge}>ROUND {round.number}</span>
          <div>
            <h2 id="market-round-title">{round.name}</h2>
            <p>
              {isClosed ? (
                <span aria-label="거래 마감">CLOSED</span>
              ) : (
                `레이스 마켓 마감까지 ${round.timeUntilClose}`
              )}
            </p>
          </div>
        </section>

        {isClosed ? (
          <section className={styles.notice} aria-label="거래 마감 안내">
            <strong>레이스 진행 중이라 지금은 주문할 수 없어요.</strong>
            <p>레이스 종료 24시간 뒤에 공식 결과로 정산된 뒤 다시 마켓을 오픈합니다.</p>
            <button type="button" disabled>실시간 채팅하러 가기</button>
          </section>
        ) : (
          <p className={styles.guide}>
            시작 가격은 지난 레이스 순위 기준이며, 본 레이스 시작 1시간 전에 마켓을 닫습니다.
          </p>
        )}

        <table className={styles.stocks} aria-label="드라이버 종목">
          <thead className={styles.visuallyHidden}>
            <tr>
              <th scope="col">기준 순위</th>
              <th scope="col">드라이버와 팀</th>
              <th scope="col">현재 거래가와 등락률</th>
              <th scope="col">누적 구매 수</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(({ name, team, startPrice, change, volume }, index) => {
              const price = Math.round(startPrice * (1 + change / 100));

              return (
                <tr key={name}>
                  <td className={styles.rank}>P{index + 1}</td>
                  <th scope="row" className={styles.driver}>
                    {name}
                    <small>{team}</small>
                  </th>
                  <td className={styles.quote}>
                    <span className={styles.price}>{formatNumber.format(price)}</span>
                    <span className={styles.change} aria-hidden={change > 0 ? undefined : true}>
                      {change > 0 && (
                        <>
                          <img src={increaseIcon} alt="" />
                          <span aria-label={`${change.toFixed(1)}퍼센트 상승`}>
                            {change.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className={styles.volume}>{formatNumber.format(volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}