import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./RaceMarketMy.module.scss";
import goToDetailIcon from "../../assets/images/racemarket/go-to-detail.svg";
import backButtonIcon from "../../assets/images/racemarket/back-button.svg";

const numberFormat = new Intl.NumberFormat("ko-KR");
const format = (value) => numberFormat.format(value);
const signed = (value) => `${value > 0 ? "+" : ""}${format(value)}`;
const percent = (value) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const holdings = [
    { rank: 1, name: "랜도 노리스", price: 50500, change: 1 },
    { rank: 7, name: "루이스 해밀턴", price: 21715, change: 1 },
    { rank: 14, name: "피에르 가슬리", price: 11000, change: 0 },
];

const settlements = [
    {
        round: 19,
        name: "멕시코시티 그랑프리",
        before: 1000000,
        roundRank: "008",
        seasonRank: "002",
        items: [
            {
                name: "랜도 노리스", from: 1, to: 1, startPrice: 50000,
                buyPrice: 50500, quantity: 6, movement: 0, bonus: 8, score: 8,
            },
            {
                name: "아이작 하자르", from: 15, to: 11, startPrice: 10000,
                buyPrice: 10800, quantity: 20, movement: 50, bonus: 0, score: 40,
            },
            {
                name: "올리버 베어먼", from: 6, to: 9, startPrice: 24000,
                buyPrice: 24000, quantity: 10, movement: -21, bonus: 1, score: -20,
            },
        ],
    },
    {
        round: 18,
        name: "미국 그랑프리",
        before: 1025000,
        roundRank: "021",
        seasonRank: "005",
        items: [
            {
                name: "랜도 노리스", from: 1, to: 2, startPrice: 50000,
                buyPrice: 55000, quantity: 10, movement: -1, bonus: 6, score: 5,
            },
        ],
    },
    {
        round: 17,
        name: "싱가포르 그랑프리",
        before: 1005500,
        roundRank: "011",
        seasonRank: "004",
        items: [
            {
                name: "막스 베르스타펜", from: 2, to: 2, startPrice: 42000,
                buyPrice: 40620, quantity: 5, movement: 0, bonus: 6, score: 6,
            },
        ],
    },
];

function settlementPrice(item) {
    return Math.round(item.startPrice * (1 + item.score / 100));
}

function itemProfit(item) {
    return (settlementPrice(item) - item.buyPrice) * item.quantity;
}

function roundProfit(record) {
    return record.items.reduce((total, item) => total + itemProfit(item), 0);
}

function tone(value) {
    if (value > 0) return styles.gain;
    if (value < 0) return styles.loss;
    return undefined;
}

function settlementUrl(round, isClosed) {
    const query = isClosed ? "?preview=closed" : "";
    return `/race-market/settlements/${round}${query}`;
}

function SettlementCard({ record, detailUrl }) {
    const profit = roundProfit(record);
    const rate = (profit / record.before) * 100;

    return (
        <section className={styles.resultCard} aria-label="라운드 정산 결과">
            <div className={styles.resultHeading}>
                <span>이번 라운드 정산 결과</span>
                <span>보유 주식은 자동 매도 완료</span>
            </div>

            <div className={`${styles.resultProfit} ${tone(profit) ?? ""}`}>
                <strong>{signed(profit)}</strong>
                <span>{percent(rate)}</span>
            </div>

            <div className={styles.resultStats}>
                <div>
                    <span>총자산</span>
                    <strong>{format(record.before)} → {format(record.before + profit)}</strong>
                </div>
                <div>
                    <span>라운드 랭킹</span>
                    <strong className={styles.rankValues}>
                        #{record.roundRank}
                        <span className={styles.seasonRank}>/ 시즌 #{record.seasonRank}</span>
                    </strong>
                </div>
            </div>

            {detailUrl && (
                <Link className={styles.resultLink} to={detailUrl}>
                    자세히 보러 가기
                </Link>
            )}
        </section>
    );
}

export function RaceMarketMy({ isClosed }) {
    const latest = settlements[0];
    const total = isClosed ? latest.before + roundProfit(latest) : latest.before;
    const invested = isClosed ? 0 : 100000;
    const seasonRate = ((total - 1000000) / 1000000) * 100;
    const history = isClosed ? settlements : settlements.slice(1);

    return (
        <div className={styles.my}>
            <section className={styles.cart} aria-labelledby="race-cart-title">
                <h2 id="race-cart-title">My Race Cart</h2>
                <span className={styles.caption}>총 레이스코인</span>
                <div className={styles.cartTotal}>
                    <strong>{format(total)}</strong>
                    <span className={tone(seasonRate)}>시즌 {percent(seasonRate)}</span>
                </div>

                <dl className={styles.cartStats}>
                    <div>
                        <dt>보유 레이스코인</dt>
                        <dd>{format(total - invested)}</dd>
                    </div>
                    <div>
                        <dt>이번 라운드 매수</dt>
                        <dd>{format(invested)}</dd>
                    </div>
                    <div>
                        <dt>시즌 랭킹</dt>
                        <dd>#{isClosed ? latest.seasonRank : settlements[1].seasonRank}</dd>
                    </div>
                </dl>
            </section>

            {isClosed ? (
                <SettlementCard record={latest} detailUrl={settlementUrl(latest.round, true)} />
            ) : (
                <section aria-labelledby="race-holdings-title">
                    <div className={styles.sectionHeading}>
                        <h2 id="race-holdings-title">이번 라운드 보유 종목</h2>
                        <span>{holdings.length}개 정산 시 자동 매도</span>
                    </div>

                    <ul className={styles.list}>
                        {holdings.map(({ rank, name, price, change }) => (
                            <li key={rank} className={styles.holding}>
                                <span className={styles.rank}>P{rank}</span>
                                <strong>{name}</strong>
                                <div className={styles.holdingPrice}>
                                    <strong>{format(price)}</strong>
                                    <small className={tone(change)}>{percent(change)}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section aria-labelledby="race-history-title">
                <h2 id="race-history-title" className={styles.heading}>정산 기록</h2>
                <ul className={styles.list}>
                    {history.map((record) => {
                        const profit = roundProfit(record);

                        return (
                            <li key={record.round}>
                                <Link
                                    className={styles.historyLink}
                                    to={settlementUrl(record.round, isClosed)}
                                >
                                    <span>ROUND {record.round} {record.name}</span>
                                    <span className={styles.historyAmount}>
                                        <strong className={tone(profit)}>{signed(profit)}</strong>
                                    </span>
                                    <img className={styles.chevron} src={goToDetailIcon} alt="" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}

export function RaceMarketSettlement() {
    const { roundId } = useParams();
    const [searchParams] = useSearchParams();
    const isClosed = searchParams.get("preview") === "closed";
    const backUrl = isClosed
        ? "/race-market?tab=my&preview=closed"
        : "/race-market?tab=my";
    const record = settlements.find(({ round }) => String(round) === roundId);

    if (!record || (!isClosed && record === settlements[0])) {
        return <Navigate to={backUrl} replace />;
    }

    return (
        <div className={styles.detail}>
            <header className={styles.detailHeader}>
                <Link to={backUrl} aria-label="마이 탭으로 돌아가기">
                    <img src={backButtonIcon} alt="" />
                </Link>
                <h1>ROUND {record.round} 정산 결과</h1>
            </header>

            <SettlementCard record={record} />

            <section className={styles.breakdown} aria-labelledby="race-breakdown-title">
                <h2 id="race-breakdown-title" className={styles.heading}>종목별 정산</h2>

                {record.items.map((item) => {
                    const price = settlementPrice(item);
                    const profit = itemProfit(item);
                    const rawScore = item.movement + item.bonus;
                    let totalLabel = "합계";

                    if (rawScore > 40) {
                        totalLabel = "합계 (상한 적용)";
                    } else if (rawScore < -30) {
                        totalLabel = "합계 (하한 적용)";
                    }

                    return (
                        <details key={item.name} className={styles.stock}>
                            <summary className={styles.stockSummary}>
                                <span>
                                    <strong className={styles.stockTitle}>
                                        <span>{item.name}</span>
                                        <span className={styles.rankChange}>P{item.from} → P{item.to}</span>
                                    </strong>
                                    <small>점수 {signed(item.score)} · 정산가 {format(price)}</small>
                                </span>
                                <span>
                                    <strong className={`${styles.stockProfit} ${tone(profit) ?? ""}`}>
                                        {signed(profit)}
                                    </strong>
                                    <small>{item.quantity}주 · 산 가격 {format(item.buyPrice)}</small>
                                </span>
                            </summary>

                            <div className={styles.calculation}>
                                <h3>{item.name} 점수 계산</h3>
                                <dl>
                                    <div>
                                        <dt>순위 변동 P{item.from} → P{item.to}</dt>
                                        <dd>{signed(item.movement)}</dd>
                                    </div>
                                    <div>
                                        <dt>결과 보너스</dt>
                                        <dd>{signed(item.bonus)}</dd>
                                    </div>
                                    <div>
                                        <dt className={styles.scoreTotal}>{totalLabel}</dt>
                                        <dd className={tone(item.score)}>{signed(item.score)}</dd>
                                    </div>
                                    <div className={styles.formula}>
                                        <dt>정산가 = {format(item.startPrice)} × {(1 + item.score / 100).toFixed(2)}</dt>
                                        <dd>{format(price)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </details>
                    );
                })}
            </section>
        </div>
    );
}