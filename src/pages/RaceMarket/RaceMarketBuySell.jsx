import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import infoIcon from "../../assets/images/racemarket/info.svg";
import minusIcon from "../../assets/images/racemarket/minus.svg";
import plusIcon from "../../assets/images/racemarket/plus.svg";
import { drivers, getMockPrice } from "./raceMarketMock";
import styles from "./RaceMarketBuySell.module.scss";

const portraits = import.meta.glob("../../assets/images/racemarket/*/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
});

const numberFormat = new Intl.NumberFormat("ko-KR");
const format = (value) => numberFormat.format(value);
const signed = (value) => (value > 0 ? `+${format(value)}` : format(value));

function getPortrait(name) {
    const entry = Object.entries(portraits).find(([path]) =>
        path.normalize("NFC").endsWith(`/${name} 미니.svg`),
    );

    return entry?.[1];
}

function getSettlementRows(rank, startPrice, price) {
    const firstRank = Math.min(Math.max(rank - 2, 1), drivers.length - 4);

    return Array.from({ length: 5 }, (_, index) => {
        const finish = firstRank + index;
        let movement = 0;

        for (let position = Math.min(rank, finish); position < Math.max(rank, finish); position += 1) {
            movement += position;
        }

        if (finish > rank) movement *= -1;

        const bonuses = [8, 6, 5, 3, 3, 1, 1, 1, 1, 1];
        const score = Math.min(40, Math.max(-30, movement + (bonuses[finish - 1] ?? 0)));
        const settlement = Math.round(startPrice * (1 + score / 100));

        return { finish, score, settlement, difference: settlement - price };
    });
}

function PriceChart({ startPrice, price }) {
    const samples = [0, 0.003, -0.001, 0.004, 0.002, 0].map((offset, index) =>
        Math.round(startPrice + ((price - startPrice) * index) / 5 + startPrice * offset),
    );
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const range = max - min || 1;
    const points = samples.map((sample, index) => ({
        x: 8 + index * (304 / 5),
        y: max === min ? 24 : 40 - ((sample - min) / range) * 32,
    }));
    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map(({ x, y }) => `${x},${y}`).join(" ");

    return (
        <figure className={styles.chart}>
            <figcaption>이번 라운드 거래가</figcaption>
            <svg
                viewBox="0 0 320 48"
                role="img"
                aria-label={`시작가 ${format(startPrice)}에서 현재 가격 ${format(price)}까지의 목업 그래프`}
            >
                <defs>
                    <linearGradient id="race-price-fill" x1="50%" y1="0%" x2="50.23%" y2="100%">
                        <stop offset="17.21%" stopColor="#FFA091" />
                        <stop offset="92.56%" stopColor="#F5F5F6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={`${first.x},48 ${line} ${last.x},48`} fill="url(#race-price-fill)" />
                <line
                    x1={first.x}
                    x2={last.x}
                    y1={first.y}
                    y2={first.y}
                    stroke="#8b8b8b"
                    strokeDasharray="3 3"
                />
                <polyline points={line} fill="none" stroke="#da291c" strokeWidth="2" />
                {[first, last].map(({ x, y }) => (
                    <circle key={x} cx={x} cy={y} r="3" fill="#fff" stroke="#da291c" strokeWidth="2" />
                ))}
            </svg>
            <small>점선 = 시작 가격</small>
        </figure>
    );
}

function DriverDetail({ driver, rank }) {
    const [mode, setMode] = useState("buy");
    const [quantity, setQuantity] = useState(1);
    const [account, setAccount] = useState({ coins: 1_000_000, shares: 0, cost: 0 });
    const [completedOrder, setCompletedOrder] = useState("");
    const dialogRef = useRef(null);

    const price = getMockPrice(driver);
    const portrait = getPortrait(driver.name);
    const isSell = mode === "sell";
    const limit = isSell ? account.shares : Math.floor(account.coins / price);
    const orderQuantity = Math.min(quantity, limit);
    const total = orderQuantity * price;
    const averageCost = account.shares > 0 ? account.cost / account.shares : 0;
    const profitPerShare = account.shares > 0 ? Math.round(price - averageCost) : 0;
    const rows = getSettlementRows(rank, driver.startPrice, price);

    function selectMode(nextMode) {
        setMode(nextMode);
        setQuantity(1);
    }

    function submitOrder() {
        if (orderQuantity < 1) return;

        if (isSell) {
            const remaining = account.shares - orderQuantity;

            setAccount({
                coins: account.coins + total,
                shares: remaining,
                cost: averageCost * remaining,
            });
        } else {
            setAccount({
                coins: account.coins - total,
                shares: account.shares + orderQuantity,
                cost: account.cost + total,
            });
        }

        setQuantity(1);
        setCompletedOrder(isSell ? "매도 완료!" : "매수 완료!");
        dialogRef.current.showModal();
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link to="/race-market" className={styles.back} aria-label="드라이버 목록으로 돌아가기">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1>{driver.name}</h1>
            </header>

            <section className={styles.summary} aria-label="종목 정보">
                {portrait && (
                    <div className={styles.avatar}>
                        <img src={portrait} alt="" />
                    </div>
                )}
                <div>
                    <div className={styles.meta}>
                        {driver.team} · 기준 순위 <strong className={styles.rank}>P{rank}</strong>
                    </div>
                    <div className={styles.quote}>
                        <strong>{format(price)}</strong>
                        <span>현재 가격</span>
                    </div>
                    {driver.change > 0 && (
                        <div className={styles.positive}>▲ {driver.change.toFixed(1)}%</div>
                    )}
                </div>
            </section>

            <PriceChart startPrice={driver.startPrice} price={price} />

            <section className={styles.settlement} aria-labelledby="settlement-title">
                <div className={styles.sectionHeading}>
                    <h2 id="settlement-title">도착 순위별 예상 정산가</h2>
                    <span>1주 기준</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">도착</th>
                            <th scope="col">점수</th>
                            <th scope="col">정산가</th>
                            <th scope="col">지금 사면</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ finish, score, settlement, difference }) => (
                            <tr key={finish}>
                                <th scope="row">P{finish}{finish === rank && " (유지)"}</th>
                                <td>{signed(score)}</td>
                                <td className={styles.settlementPrice}>{format(settlement)}</td>
                                <td className={styles.settlementDifference}>{signed(difference)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className={styles.order} aria-label="종목 주문">
                <div className={styles.modes} role="group" aria-label="주문 유형">
                    <button type="button" className={styles.buy} aria-pressed={!isSell} onClick={() => selectMode("buy")}>
                        매수
                    </button>
                    <button type="button" className={styles.sell} aria-pressed={isSell} onClick={() => selectMode("sell")}>
                        매도
                    </button>
                </div>

                <div className={styles.quantity}>
                    <div>수량 <small>보유 {format(account.shares)}주</small></div>
                    <div className={styles.stepper}>
                        <button
                            type="button"
                            className={styles.decrease}
                            aria-label="수량 줄이기"
                            disabled={orderQuantity <= 1}
                            onClick={() => setQuantity(orderQuantity - 1)}
                        >
                            <img src={minusIcon} alt="" />
                        </button>
                        <output aria-label="주문 수량">{format(orderQuantity)}</output>
                        <button
                            type="button"
                            aria-label="수량 늘리기"
                            disabled={orderQuantity >= limit}
                            onClick={() => setQuantity(orderQuantity + 1)}
                        >
                            <img src={plusIcon} alt="" />
                        </button>
                    </div>
                </div>

                <div className={styles.balance}>
                    <span>{isSell ? "지금 팔면 1주당 손익" : "주문 가능 레이스코인"}</span>
                    <strong>{isSell ? (account.shares ? signed(profitPerShare) : "—") : format(account.coins)}</strong>
                </div>

                <p className={styles.notice}>
                    <img src={infoIcon} alt="" />
                    <span>
                        {isSell
                            ? "이 멘트 안내 부분 AI 연동 필요..? (기능명세서 참고) 지금 팔면 현재 거래가로 레이스코인을 받아요."
                            : "이 멘트 안내 부분 AI 연동 필요..? (기능명세서 참고) 매수는 현재 거래가로 체결돼요. 레이스 결과에 따른 정산가는 시작 가격을 기준으로 계산해요."}
                    </span>
                </p>

                <button
                    type="button"
                    className={`${styles.submit} ${isSell ? styles.sell : styles.buy}`}
                    disabled={orderQuantity === 0}
                    onClick={submitOrder}
                >
                    {orderQuantity === 0
                        ? isSell ? "매도할 보유 주식이 없어요" : "주문 가능 코인이 부족해요"
                        : `${format(orderQuantity)}주 ${isSell ? "팔기" : "사기"} · 총 ${format(total)}`}
                </button>
            </section>

            <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="order-result-title">
                <div aria-hidden="true">🏎️</div>
                <h2 id="order-result-title">{completedOrder}</h2>
                <form method="dialog">
                    <button type="submit">확인</button>
                </form>
            </dialog>
        </div>
    );
}

export default function RaceMarketDriver() {
    const { driverId } = useParams();
    const rank = Number(driverId);
    const driver = Number.isInteger(rank) ? drivers[rank - 1] : undefined;

    if (!driver) return <Navigate to="/race-market" replace />;

    return <DriverDetail key={rank} driver={driver} rank={rank} />;
}