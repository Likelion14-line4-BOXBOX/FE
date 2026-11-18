import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/images/racemarket/race-market-logo.svg";
import increaseIcon from "../../assets/images/racemarket/red-increase.svg";
import styles from "./RaceMarket.module.scss";
import { RaceMarketMy } from "./RaceMarketMy";
import { RaceMarketRanking } from "./RaceMarketRanking";
import { drivers, getMockPrice } from "./raceMarketMock";
import LoginGuide from "../../components/common/LoginGuide/LoginGuide";
import { useMarketAccess } from "./MarketAccessContext";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
    .replace(/(?:\/api)?$/, "/api");

const mockRound = {
    roundNumber: 19,
    raceName: "멕시코시티 그랑프리",
};

const mockStocks = drivers.map((entry, index) => ({
    driver: {
        driverId: String(index + 1),
        name: entry.name,
        teamName: entry.team,
    },
    baseRank: index + 1,
    currentPrice: getMockPrice(entry),
    changeRate: entry.change,
    totalBuyQuantity: entry.volume,
}));

const numberFormat = new Intl.NumberFormat("ko-KR");
const rateFormat = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
});

async function requestMarket(path, signal) {
    const response = await fetch(`${apiBase}${path}`, {
        signal,
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.data) {
        throw new Error(
            payload?.error?.message || "레이스마켓 데이터를 불러오지 못했습니다.",
        );
    }

    return payload;
}

async function loadMarket(signal) {
    const { data, meta } = await requestMarket("/market/rounds/current", signal);
    const serverTime = Date.parse(meta?.serverTime);
    const round = data.round;

    if (!Number.isFinite(serverTime) || (round !== null && !round?.roundId)) {
        throw new Error("현재 라운드 응답 형식을 확인해 주세요.");
    }

    const clockOffset = serverTime - Date.now();
    const stocks = [];

    if (round) {
        const path = `/market/rounds/${encodeURIComponent(round.roundId)}/stocks`;
        const query = new URLSearchParams({ sort: "BASE_RANK", size: "100" });
        const seenCursors = new Set();

        while (true) {
            const { data: page } = await requestMarket(`${path}?${query}`, signal);
            stocks.push(...page.items);

            if (!page.hasNext) break;

            if (!page.nextCursor || seenCursors.has(page.nextCursor)) {
                throw new Error("다음 종목 목록을 불러오지 못했습니다.");
            }

            seenCursors.add(page.nextCursor);
            query.set("cursor", page.nextCursor);
        }
    }

    return { round, stocks, clockOffset };
}

function formatRemaining(milliseconds) {
    const minutes = Math.ceil(milliseconds / 60_000);
    const days = Math.floor(minutes / 1_440);
    const hours = Math.floor((minutes % 1_440) / 60);

    return [
        days > 0 && `${days}일`,
        hours > 0 && `${hours}시간`,
        `${minutes % 60}분`,
    ].filter(Boolean).join(" ");
}

function DriverStocks({ stocks, roundId }) {
    const navigate = useNavigate();

    if (stocks.length === 0) {
        return <p className={styles.guide}>공개된 드라이버 종목이 없습니다.</p>;
    }

    return (
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
                {stocks.map(({ driver, baseRank, currentPrice, changeRate, totalBuyQuantity }) => {
                    const path = `/race-market/drivers/${encodeURIComponent(driver.driverId)}`;
                    const detailUrl = roundId
                        ? `${path}?${new URLSearchParams({ roundId })}`
                        : path;
                    const detailState = roundId
                        ? { driverName: driver.name }
                        : undefined;

                    return (
                        <tr
                            key={driver.driverId}
                            className={styles.stockRow}
                            onClick={(event) => {
                                if (event.target.closest("a")) return;
                                navigate(detailUrl, { state: detailState });
                            }}
                        >
                            <td className={styles.rank}>P{baseRank}</td>
                            <th scope="row" className={styles.driver}>
                                <Link
                                    className={styles.driverLink}
                                    to={detailUrl}
                                    state={detailState}
                                    aria-label={`${driver.name} 종목 상세 보기`}
                                >
                                    {driver.name}
                                </Link>
                                <small>{driver.teamName}</small>
                            </th>
                            <td className={styles.quote}>
                                <span className={styles.price}>
                                    {numberFormat.format(currentPrice)}
                                </span>
                                <span className={styles.change}>
                                    {changeRate > 0 && <img src={increaseIcon} alt="" />}
                                    {rateFormat.format(changeRate)}%
                                </span>
                            </td>
                            <td className={styles.volume}>
                                {numberFormat.format(totalBuyQuantity)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default function RaceMarket() {
    const [searchParams] = useSearchParams();
    const [market, setMarket] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [now, setNow] = useState(Date.now);

    const tab = searchParams.get("tab");
    const isMyTab = tab === "my";
    const isRankingTab = tab === "ranking";
    const isDriverTab = !isMyTab && !isRankingTab;
    const previewClosed = searchParams.get("preview") === "closed";
    const { isAuthenticated, onLogin } = useMarketAccess();

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        loadMarket(signal)
            .then((result) => {
                if (signal.aborted) return;
                setMarket(result);
                setNow(Date.now());
            })
            .catch(() => {
                if (!signal.aborted) setFailed(true);
            });

        return () => controller.abort();
    }, [attempt]);

    useEffect(() => {
        if (market?.round?.status !== "OPEN") return;

        const timer = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(timer);
    }, [market]);

    const round = failed ? mockRound : market?.round;
    const stocks = failed ? mockStocks : (market?.stocks ?? []);
    const serverNow = now + (market?.clockOffset ?? 0);
    const remaining = Date.parse(round?.closeAt) - serverNow;
    const isClosed = failed
        ? previewClosed
        : round?.status === "CLOSED" || remaining <= 0;
    const isOpen = failed
        ? !previewClosed
        : round?.status === "OPEN"
            && Date.parse(round.openAt) <= serverNow
            && remaining > 0;

    function retry() {
        setFailed(false);
        setAttempt((value) => value + 1);
    }

    function tabUrl(value) {
        const query = new URLSearchParams();

        if (value) query.set("tab", value);
        if (previewClosed) query.set("preview", "closed");

        return query.size ? `/race-market?${query}` : "/race-market";
    }

    const tabs = [
        { value: "", active: isDriverTab, label: "드라이버" },
        { value: "ranking", active: isRankingTab, label: "유저 랭킹" },
        { value: "my", active: isMyTab, label: "마이" },
    ];

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1><img src={logo} alt="Race Market" /></h1>
                <nav className={styles.tabs} aria-label="레이스마켓 메뉴">
                    {tabs.map(({ value, active, label }) => (
                        <Link
                            key={value}
                            to={tabUrl(value)}
                            className={active ? styles.activeTab : undefined}
                            aria-current={active ? "page" : undefined}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </header>

            <div className={styles.content}>
                {isMyTab && (
                    isAuthenticated ? (
                        <RaceMarketMy isClosed={isClosed} />
                    ) : (
                        <LoginGuide onLogin={onLogin} />
                    )
                )}
                {isRankingTab && <RaceMarketRanking />}

                {isDriverTab && (
                    <>
                        {failed && (
                            <section className={`${styles.notice} ${styles.mockNotice}`} aria-label="예시 데이터 안내">
                                <strong>예시 데이터를 표시하고 있어요.</strong>
                                <p role="status">실제 레이스마켓 데이터를 불러오지 못했습니다.</p>
                                <button type="button" onClick={retry}>다시 시도</button>
                            </section>
                        )}

                        {!market && !failed && (
                            <p role="status">레이스마켓을 불러오는 중입니다.</p>
                        )}

                        {market && !round && (
                            <p className={styles.guide}>현재 조회할 수 있는 라운드가 없습니다.</p>
                        )}

                        {round && (
                            <>
                                <section
                                    className={isClosed ? `${styles.round} ${styles.closed}` : styles.round}
                                    aria-labelledby="market-round-title"
                                >
                                    <span className={styles.badge}>ROUND {round.roundNumber}</span>
                                    <div>
                                        <h2 id="market-round-title">{round.raceName}</h2>
                                        <p>
                                            {isOpen
                                                ? `레이스 마켓 마감까지 ${failed ? "5일 3시간 40분" : formatRemaining(remaining)}`
                                                : isClosed ? "거래 마감" : "거래 시작 전"}
                                        </p>
                                    </div>
                                </section>

                                                                {isClosed ? (
                                    <section className={styles.notice} aria-label="거래 마감 안내">
                                        <strong>거래가 마감되어 지금은 주문할 수 없어요.</strong>
                                        <p>
                                            종목 정보는 계속 확인할 수 있으며,
                                            정산 결과는 레이스 종료 24시간 뒤부터 공개됩니다.
                                        </p>
                                    </section>
                                ) : (
                                    <p className={styles.guide}>
                                        시작 가격은 전 레이스 기준 순위이며, 
                                        본 레이스 한 시간 전 마켓을 닫습니다.
                                    </p>
                                )}

                                <DriverStocks
                                    stocks={stocks}
                                    roundId={failed ? undefined : round.roundId}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}