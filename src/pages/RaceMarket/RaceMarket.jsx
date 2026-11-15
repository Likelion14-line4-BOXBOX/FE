import { Link, useSearchParams } from "react-router-dom";
import logo from "../../assets/images/racemarket/race-market-logo.svg";
import increaseIcon from "../../assets/images/racemarket/red-increase.svg";
import styles from "./RaceMarket.module.scss";
import { drivers, getMockPrice } from "./raceMarketMock";
import { RaceMarketMy } from "./RaceMarketMy";

const round = {
  number: 19,
  name: "멕시코시티 그랑프리",
  timeUntilClose: "5일 3시간 40분",
};

const formatNumber = new Intl.NumberFormat("ko-KR");

export default function RaceMarket() {
  const [searchParams] = useSearchParams();
  const isClosed = searchParams.get("preview") === "closed";
  const isMyTab = searchParams.get("tab") === "my";
  const driverTabUrl = isClosed ? "/race-market?preview=closed" : "/race-market";
  const myTabUrl = isClosed
    ? "/race-market?tab=my&preview=closed"
    : "/race-market?tab=my";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1><img src={logo} alt="Race Market" /></h1>
        <div className={styles.tabs} aria-label="레이스마켓 메뉴">
          <Link
            to={driverTabUrl}
            className={isMyTab ? undefined : styles.activeTab}
            aria-current={isMyTab ? undefined : "page"}
          >
            {isClosed ? "드라이버 랭킹" : "드라이버"}
          </Link>

          <button type="button" disabled>유저 랭킹</button>

          <Link
            to={myTabUrl}
            className={isMyTab ? styles.activeTab : undefined}
            aria-current={isMyTab ? "page" : undefined}
          >
            마이
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        {isMyTab ? (
          <RaceMarketMy isClosed={isClosed} />
        ) : (
          <>
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
            시작 가격은 전 레이스 기준 순위이며, 본 레이스 시작시 마켓을 닫습니다.
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
            {drivers.map((driver, index) => {
              const { name, team, change, volume } = driver;
              const price = getMockPrice(driver);

              return (
                <tr key={name}>
                  <td className={styles.rank}>P{index + 1}</td>
                  <th scope="row" className={styles.driver}>
                    {isClosed ? (
                      name
                    ) : (
                      <Link className={styles.driverLink} to={`/race-market/drivers/${index + 1}`}>
                        {name}
                      </Link>
                    )}
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
        </>
      )}
      </div>
    </div>
  );
}