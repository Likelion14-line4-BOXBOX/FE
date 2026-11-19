import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./RaceMarketMy.module.scss";
import goToDetailIcon from "../../assets/images/racemarket/go-to-detail.svg";
import backButtonIcon from "../../assets/images/racemarket/back-button.svg";
import LoginGuide from "../../components/common/LoginGuide/LoginGuide";
import { useMarketAccess } from "./marketAccess";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
    .replace(/(?:\/api)?$/, "/api");

const numberFormat = new Intl.NumberFormat("ko-KR");
const format = (value) => value == null ? "—" : numberFormat.format(value);
const signed = (value) => value == null ? "—" : `${value > 0 ? "+" : ""}${format(value)}`;
const percent = (value) => value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const formatRank = (value) => value == null ? "—" : `#${value}`;

const mockHoldings = [
    { id: "norris", rank: 1, name: "랜도 노리스", price: 50500, rate: 1 },
    { id: "hamilton", rank: 7, name: "루이스 해밀턴", price: 21715, rate: 1 },
    { id: "gasly", rank: 14, name: "피에르 가슬리", price: 11000, rate: 0 },
];

const mockSettlements = [
    {
        round: 19,
        name: "멕시코시티 그랑프리",
        before: 1000000,
        roundRank: "008",
        seasonRank: "002",
        items: [
            {
                name: "랜도 노리스",
                from: 1,
                to: 1,
                startPrice: 50000,
                buyPrice: 50500,
                quantity: 6,
                movement: 0,
                bonus: 8,
                score: 8,
            },
            {
                name: "아이작 하자르",
                from: 15,
                to: 11,
                startPrice: 10000,
                buyPrice: 10800,
                quantity: 20,
                movement: 50,
                bonus: 0,
                score: 40,
            },
            {
                name: "올리버 베어먼",
                from: 6,
                to: 9,
                startPrice: 24000,
                buyPrice: 24000,
                quantity: 10,
                movement: -21,
                bonus: 1,
                score: -20,
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
                name: "랜도 노리스",
                from: 1,
                to: 2,
                startPrice: 50000,
                buyPrice: 55000,
                quantity: 10,
                movement: -1,
                bonus: 6,
                score: 5,
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
                name: "막스 베르스타펜",
                from: 2,
                to: 2,
                startPrice: 42000,
                buyPrice: 40620,
                quantity: 5,
                movement: 0,
                bonus: 6,
                score: 6,
            },
        ],
    },
].map((record) => {
    const items = record.items.map((item) => {
        const price = Math.round(item.startPrice * (1 + item.score / 100));

        return {
            ...item,
            id: item.name,
            price,
            profit: (price - item.buyPrice) * item.quantity,
        };
    });
    const profit = items.reduce((total, item) => total + item.profit, 0);

    return {
        ...record,
        id: String(record.round),
        status: "PUBLISHED",
        items,
        profit,
        after: record.before + profit,
        rate: profit / record.before * 100,
    };
});

async function requestMy(path, accessToken, signal) {
    const response = await fetch(`${apiBase}${path}`, {
        signal,
        credentials: "include",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.data) {
        const error = new Error(
            payload?.error?.message || "레이스마켓 정보를 불러오지 못했어요.",
        );
        error.code = payload?.error?.code;
        throw error;
    }

    return payload.data;
}

async function loadSettlements(accessToken, signal, season) {
    const query = new URLSearchParams({ size: "100" });
    if (season != null) query.set("season", String(season));

    const records = [];
    const cursors = new Set();

    while (true) {
        const page = await requestMy(`/me/settlements?${query}`, accessToken, signal);

        if (!Array.isArray(page.items)) {
            throw new Error("정산 목록 응답을 확인해 주세요.");
        }

        records.push(...page.items);

        if (!page.hasNext) return records;

        if (!page.nextCursor || cursors.has(page.nextCursor)) {
            throw new Error("다음 정산 기록을 불러오지 못했어요.");
        }

        cursors.add(page.nextCursor);
        query.set("cursor", page.nextCursor);
    }
}

function useMyRequest(load) {
    const [state, setState] = useState({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        load(signal)
            .then((data) => {
                if (!signal.aborted) setState({ status: "success", data });
            })
            .catch((error) => {
                if (!signal.aborted) setState({ status: "error", error });
            });

        return () => controller.abort();
    }, [load, attempt]);

    function retry() {
        setState({ status: "loading" });
        setAttempt((value) => value + 1);
    }

    return { ...state, retry };
}

function tone(value) {
    if (value > 0) return styles.gain;
    if (value < 0) return styles.loss;
    return undefined;
}

function mockSettlementUrl(record, isClosed) {
    const query = isClosed ? "?preview=closed" : "";
    return `/race-market/settlements/${record.id}${query}`;
}

function liveSettlementUrl(record) {
    const query = new URLSearchParams({
        source: "api",
        roundNumber: String(record.round),
    });

    return `/race-market/settlements/${encodeURIComponent(record.id)}?${query}`;
}

function toSettlementRecord(data) {
    return {
        id: data.roundId,
        round: data.roundNumber,
        name: data.raceName,
        status: data.status,
        before: data.roundStartAssets,
        after: data.endingAssets,
        profit: data.roundPnl,
        rate: data.returnRate,
        roundRank: data.rank,
        seasonRank: data.seasonRank,
    };
}

function settlementStatus(record) {
    switch (record.status) {
        case "PUBLISHED":
            return signed(record.profit);
        case "FAILED":
            return "정산 처리 실패";
        case "PROCESSING":
            return "정산 진행 중";
        default:
            return "정산 대기";
    }
}

function SettlementCard({ record, detailUrl }) {
    const { profit, rate, before, after, roundRank, seasonRank } = record;

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
                    <strong>{format(before)} → {format(after)}</strong>
                </div>
                <div>
                    <span>라운드 랭킹</span>
                    <strong className={styles.rankValues}>
                        {formatRank(roundRank)}
                        {seasonRank != null && (
                            <span className={styles.seasonRank}>
                                {" / 시즌 "}{formatRank(seasonRank)}
                            </span>
                        )}
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

function RaceMarketMyView({
    account,
    holdings,
    records,
    currentSettlement,
    detailUrl,
    isMock = false,
    onRetry,
}) {
    return (
        <div className={styles.my}>
            {isMock && (
                <div>
                    <p role="status">예시 보유 자산과 정산 기록을 표시하고 있어요.</p>
                    {onRetry && (
                        <button type="button" onClick={onRetry}>실제 데이터 다시 조회</button>
                    )}
                </div>
            )}

            <section className={styles.cart} aria-labelledby="race-cart-title">
                <h2 id="race-cart-title">My Race Cart</h2>
                <span className={styles.caption}>{isMock ? "총 레이스코인" : "총자산"}</span>
                <div className={styles.cartTotal}>
                    <strong>{format(account.total)}</strong>
                    <span className={tone(account.seasonRate)}>시즌 {percent(account.seasonRate)}</span>
                </div>

                <dl className={styles.cartStats}>
                    <div>
                        <dt>보유 레이스코인</dt>
                        <dd>{format(account.cash)}</dd>
                    </div>
                    <div>
                        <dt>{isMock ? "이번 라운드 매수" : "보유 종목 평가액"}</dt>
                        <dd>{format(account.stockValue)}</dd>
                    </div>
                    <div>
                        <dt>시즌 랭킹</dt>
                        <dd>{formatRank(account.seasonRank)}</dd>
                    </div>
                </dl>
            </section>

            {currentSettlement ? (
                <SettlementCard
                    record={currentSettlement}
                    detailUrl={detailUrl(currentSettlement)}
                />
            ) : (
                <section aria-labelledby="race-holdings-title">
                    <div className={styles.sectionHeading}>
                        <h2 id="race-holdings-title">이번 라운드 보유 종목</h2>
                        <span>{holdings.length}개 정산 시 자동 매도</span>
                    </div>

                    {holdings.length === 0 ? (
                        <p>보유한 종목이 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {holdings.map(({ id, rank, name, price, rate }) => (
                                <li key={id} className={styles.holding}>
                                    <span className={styles.rank}>P{rank}</span>
                                    <strong>{name}</strong>
                                    <div className={styles.holdingPrice}>
                                        <strong>{format(price)}</strong>
                                        <small className={tone(rate)}>
                                            {!isMock && "매입 대비 "}{percent(rate)}
                                        </small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section aria-labelledby="race-history-title">
                <h2 id="race-history-title" className={styles.heading}>정산 기록</h2>

                {records.length === 0 ? (
                    <p>정산 기록이 없습니다.</p>
                ) : (
                    <ul className={styles.list}>
                        {records.map((record) => {
                            const label = `ROUND ${record.round} ${record.name}`;
                            const status = settlementStatus(record);

                            return (
                                <li key={record.id}>
                                    {record.status === "PUBLISHED" ? (
                                        <Link className={styles.historyLink} to={detailUrl(record)}>
                                            <span>{label}</span>
                                            <span className={styles.historyAmount}>
                                                <strong className={tone(record.profit)}>{status}</strong>
                                            </span>
                                            <img className={styles.chevron} src={goToDetailIcon} alt="" />
                                        </Link>
                                    ) : (
                                        <div className={styles.historyLink}>
                                            <span>{label}</span>
                                            <span className={styles.historyAmount}>{status}</span>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

function MockRaceMarketMy({ isClosed, onRetry }) {
    const latest = mockSettlements[0];
    const total = isClosed ? latest.after : latest.before;
    const invested = isClosed ? 0 : 100000;

    return (
        <RaceMarketMyView
            isMock
            onRetry={onRetry}
            account={{
                total,
                cash: total - invested,
                stockValue: invested,
                seasonRate: (total - 1000000) / 1000000 * 100,
                seasonRank: isClosed ? latest.seasonRank : mockSettlements[1].seasonRank,
            }}
            holdings={mockHoldings}
            records={isClosed ? mockSettlements : mockSettlements.slice(1)}
            currentSettlement={isClosed ? latest : null}
            detailUrl={(record) => mockSettlementUrl(record, isClosed)}
        />
    );
}

function LiveRaceMarketMy({ accessToken, roundId, season, isClosed }) {
    const load = useCallback(async (signal) => {
        const query = roundId ? `?${new URLSearchParams({ roundId })}` : "";
        const [portfolio, settlements] = await Promise.all([
            requestMy(`/me/portfolio${query}`, accessToken, signal),
            loadSettlements(accessToken, signal, season),
        ]);

        if (!Array.isArray(portfolio.positions)) {
            throw new Error("보유 자산 응답을 확인해 주세요.");
        }

        return { portfolio, records: settlements.map(toSettlementRecord) };
    }, [accessToken, roundId, season]);

    const result = useMyRequest(load);

    if (result.status === "loading") {
        return <p role="status">보유 자산과 정산 기록을 불러오는 중입니다.</p>;
    }

    if (result.status === "error") {
        return <MockRaceMarketMy isClosed={isClosed} onRetry={result.retry} />;
    }

    const { portfolio, records } = result.data;
    const currentSettlement = records.find(
        (record) => record.id === portfolio.roundId && record.status === "PUBLISHED",
    );

    const holdings = portfolio.positions.map((position) => ({
        id: position.driver.driverId,
        rank: position.baseRank,
        name: position.driver.name,
        price: position.currentPrice,
        rate: position.returnRate,
    }));

    return (
        <RaceMarketMyView
            account={{
                total: portfolio.totalAssets,
                cash: portfolio.cashBalance,
                stockValue: portfolio.stockValue,
                seasonRate: portfolio.seasonReturnRate,
                seasonRank: portfolio.seasonRank,
            }}
            holdings={holdings}
            records={records}
            currentSettlement={currentSettlement}
            detailUrl={liveSettlementUrl}
        />
    );
}

export function RaceMarketMy({ isClosed, accessToken, roundId, season }) {
    if (!accessToken) {
        return <MockRaceMarketMy isClosed={isClosed} />;
    }

    return (
        <LiveRaceMarketMy
            key={`${accessToken}:${roundId ?? ""}:${season ?? ""}`}
            accessToken={accessToken}
            roundId={roundId}
            season={season}
            isClosed={isClosed}
        />
    );
}

function SettlementDetail({ record, backUrl, isMock = false }) {
    return (
        <div className={styles.detail}>
            <header className={styles.detailHeader}>
                <Link to={backUrl} aria-label="마이 탭으로 돌아가기">
                    <img src={backButtonIcon} alt="" />
                </Link>
                <h1>{record.round ? `ROUND ${record.round} 정산 결과` : "라운드 정산 결과"}</h1>
            </header>

            {isMock && <p role="status">예시 정산 결과를 표시하고 있어요.</p>}

            <SettlementCard record={record} />

            <section className={styles.breakdown} aria-labelledby="race-breakdown-title">
                <h2 id="race-breakdown-title" className={styles.heading}>종목별 정산</h2>

                {record.items.length === 0 && <p>정산된 종목이 없습니다.</p>}

                {record.items.map((item) => {
                    const finish = item.to == null ? "미완주" : `P${item.to}`;
                    const rawScore = item.movement + item.bonus;
                    let totalLabel = "합계";

                    if (item.score < rawScore) {
                        totalLabel = "합계 (상한 적용)";
                    } else if (item.score > rawScore) {
                        totalLabel = "합계 (하한 적용)";
                    }

                    return (
                        <details key={item.id} className={styles.stock}>
                            <summary className={styles.stockSummary}>
                                <span>
                                    <strong className={styles.stockTitle}>
                                        <span>{item.name}</span>
                                        <span className={styles.rankChange}>P{item.from} → {finish}</span>
                                    </strong>
                                    <small>점수 {signed(item.score)} · 정산가 {format(item.price)}</small>
                                </span>
                                <span>
                                    <strong className={`${styles.stockProfit} ${tone(item.profit) ?? ""}`}>
                                        {signed(item.profit)}
                                    </strong>
                                    <small>{format(item.quantity)}주 · 평균 매입가 {format(item.buyPrice)}</small>
                                </span>
                            </summary>

                            <div className={styles.calculation}>
                                <h3>{item.name} 점수 계산</h3>
                                <dl>
                                    <div>
                                        <dt>순위 변동 P{item.from} → {finish}</dt>
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
                                        <dd>{format(item.price)}</dd>
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

function LiveSettlementDetail({ roundId, roundNumber, accessToken, backUrl }) {
    const load = useCallback(async (signal) => {
        const data = await requestMy(
            `/me/settlements/${encodeURIComponent(roundId)}`,
            accessToken,
            signal,
        );

        if (!Array.isArray(data.items)) {
            throw new Error("정산 상세 응답을 확인해 주세요.");
        }

        return {
            ...toSettlementRecord(data),
            round: roundNumber,
            items: data.items.map((item) => ({
                id: item.driverId,
                name: item.driverName,
                from: item.baseRank,
                to: item.finishRank,
                startPrice: item.startingPrice,
                buyPrice: item.quantity > 0 ? item.totalCost / item.quantity : null,
                quantity: item.quantity,
                movement: item.positionScore,
                bonus: item.resultBonus,
                score: item.finalScore,
                price: item.settlementPrice,
                profit: item.settlementPnl,
            })),
        };
    }, [roundId, roundNumber, accessToken]);

    const result = useMyRequest(load);

    if (result.status === "success") {
        return <SettlementDetail record={result.data} backUrl={backUrl} />;
    }

    const loading = result.status === "loading";
    const missing = result.error?.code === "SETTLEMENT_NOT_FOUND";

    return (
        <div className={styles.detail}>
            <Link to={backUrl}>마이 탭으로 돌아가기</Link>
            <p role={loading ? "status" : "alert"}>
                {loading ? "정산 결과를 불러오는 중입니다." : result.error.message}
            </p>
            {!loading && !missing && (
                <button type="button" onClick={result.retry}>다시 시도</button>
            )}
        </div>
    );
}

export function RaceMarketSettlement({ accessToken }) {
    const { roundId } = useParams();
    const [searchParams] = useSearchParams();
    const isClosed = searchParams.get("preview") === "closed";
    const backUrl = isClosed
        ? "/race-market?tab=my&preview=closed"
        : "/race-market?tab=my";
    const { isAuthenticated, onLogin } = useMarketAccess();

    if (!isAuthenticated) {
        return (
            <div className={styles.detail}>
                <Link to={backUrl}>마이 탭으로 돌아가기</Link>
                <LoginGuide onLogin={onLogin} />
            </div>
        );
    }

    if (searchParams.get("source") === "api") {
        if (!accessToken) {
            return (
                <div className={styles.detail}>
                    <Link to={backUrl}>마이 탭으로 돌아가기</Link>
                    <p>로그인 후 정산 결과를 확인할 수 있어요.</p>
                </div>
            );
        }

        const roundNumber = searchParams.get("roundNumber");

        return (
            <LiveSettlementDetail
                key={`${accessToken}:${roundId}:${roundNumber ?? ""}`}
                roundId={roundId}
                roundNumber={roundNumber}
                accessToken={accessToken}
                backUrl={backUrl}
            />
        );
    }

    const record = mockSettlements.find((entry) => entry.id === roundId);

    if (!record || (!isClosed && record === mockSettlements[0])) {
        return <Navigate to={backUrl} replace />;
    }

    return <SettlementDetail record={record} backUrl={backUrl} isMock />;
}