import { useEffect, useId, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import infoIcon from "../../assets/images/racemarket/info.svg";
import minusIcon from "../../assets/images/racemarket/minus.svg";
import plusIcon from "../../assets/images/racemarket/plus.svg";
import { drivers, getMockPrice } from "./raceMarketMock";
import styles from "./RaceMarketBuySell.module.scss";
import { useMarketAccess } from "./marketAccess";
import LoginGuide from "../../components/common/LoginGuide/LoginGuide";
import backButtonIcon from "../../assets/images/racemarket/back-button.svg";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
    .replace(/(?:\/api)?$/, "/api");

const portraits = import.meta.glob("../../assets/images/racemarket/*/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
});

const numberFormat = new Intl.NumberFormat("ko-KR");
const format = (value) => numberFormat.format(value);
const signed = (value) => value > 0 ? `+${format(value)}` : format(value);

function roundPath(roundId) {
    return `/market/rounds/${encodeURIComponent(roundId)}`;
}

async function requestMarket(path, { signal, accessToken, body, orderKey } = {}) {
    const response = await fetch(`${apiBase}${path}`, {
        method: body === undefined ? "GET" : "POST",
        signal,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...(orderKey ? { "Idempotency-Key": orderKey } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.data) {
        const error = new Error(
            payload?.error?.message || `레이스마켓 요청에 실패했습니다. (${response.status})`,
        );
        error.status = response.status;
        error.code = payload?.error?.code;
        throw error;
    }

    return payload;
}

async function loadPriceHistory(path, signal) {
    const query = new URLSearchParams({ interval: "1h", size: "100" });
    const samples = [];
    const seenCursors = new Set();

    while (true) {
        const { data } = await requestMarket(`${path}/prices?${query}`, { signal });
        samples.push(...data.items.map((item) => item.close));

        if (!data.hasNext) return samples;

        if (!data.nextCursor || seenCursors.has(data.nextCursor)) {
            throw new Error("다음 가격 기록을 불러오지 못했습니다.");
        }

        seenCursors.add(data.nextCursor);
        query.set("cursor", data.nextCursor);
    }
}

function getPortrait(name) {
    return Object.entries(portraits).find(([path]) =>
        path.normalize("NFC").endsWith(`/${name.normalize("NFC")} 미니.svg`),
    )?.[1];
}

function getMockSettlementRows(rank, startPrice) {
    const firstRank = Math.min(Math.max(rank - 2, 1), drivers.length - 4);
    const bonuses = [8, 6, 5, 3, 3, 1, 1, 1, 1, 1];

    return Array.from({ length: 5 }, (_, index) => {
        const finish = firstRank + index;
        const movement = (rank - finish) * (rank + finish - 1) / 2;
        const score = Math.min(40, Math.max(-30, movement + (bonuses[finish - 1] ?? 0)));

        return {
            finish,
            score,
            settlement: Math.round(startPrice * (1 + score / 100)),
        };
    });
}

function PriceChart({ startPrice, price, isMock, history }) {
    const fillId = useId();

    if (!isMock && !history?.length) {
        let message = "표시할 가격 기록이 없어요.";

        if (history === undefined) message = "가격 기록을 불러오는 중입니다.";
        if (history === null) message = "가격 기록을 불러오지 못했어요.";

        return (
            <figure className={styles.chart}>
                <figcaption>이번 라운드 거래가</figcaption>
                <p role="status">{message}</p>
            </figure>
        );
    }

    const originalSamples = isMock
        ? [0, 0.003, -0.001, 0.004, 0.002, 0].map((offset, index) =>
            Math.round(startPrice + (price - startPrice) * index / 5 + startPrice * offset),
        )
        : history;

    const samples = originalSamples.length <= 6
        ? originalSamples
        : Array.from({ length: 6 }, (_, index) => {
            const sourceIndex = Math.round(
                index * (originalSamples.length - 1) / 5,
            );

            return originalSamples[sourceIndex];
        });

    const min = Math.min(startPrice, ...samples);
    const max = Math.max(startPrice, ...samples);
    const priceY = (value) => max === min ? 24 : 40 - (value - min) / (max - min) * 32;
    const points = samples.map((sample, index) => ({
        x: samples.length === 1 ? 160 : 8 + index * 304 / (samples.length - 1),
        y: priceY(sample),
    }));

    const first = points[0];
    const last = points[points.length - 1];
    const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
    const markers = points.length === 1 ? [first] : [first, last];

    return (
        <figure className={styles.chart}>
            <figcaption>이번 라운드 거래가</figcaption>
            <svg
                viewBox="0 0 320 48"
                role="img"
                aria-label={isMock ? "예시 거래가 그래프" : "거래가 그래프"}
            >
                <defs>
                    <linearGradient id={fillId} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="17.21%" stopColor="#FFA091" />
                        <stop offset="92.56%" stopColor="#F5F5F6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={`${first.x},48 ${line} ${last.x},48`} fill={`url(#${fillId})`} />
                <line
                    x1="8"
                    x2="312"
                    y1={priceY(startPrice)}
                    y2={priceY(startPrice)}
                    stroke="#8b8b8b"
                    strokeDasharray="3 3"
                />
                <polyline points={line} fill="none" stroke="#da291c" strokeWidth="2" />
                {markers.map(({ x, y }) => (
                    <circle key={x} cx={x} cy={y} r="3" fill="#fff" stroke="#da291c" strokeWidth="2" />
                ))}
            </svg>
            <small>점선 = 시작 가격</small>
        </figure>
    );
}

function OrderFields({ side, quantity, limit, shares, locked, onSide, onQuantity }) {
    return (
        <>
            <div className={styles.modes} role="group" aria-label="주문 유형">
                {["BUY", "SELL"].map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={option === "BUY" ? styles.buy : styles.sell}
                        aria-pressed={side === option}
                        disabled={locked}
                        onClick={() => onSide(option)}
                    >
                        {option === "BUY" ? "매수" : "매도"}
                    </button>
                ))}
            </div>

            <div className={styles.quantity}>
                <div>수량 <small>보유 {shares == null ? "—" : format(shares)}주</small></div>
                <div className={styles.stepper}>
                    <button
                        type="button"
                        className={styles.decrease}
                        aria-label="수량 줄이기"
                        disabled={locked || quantity <= 1}
                        onClick={() => onQuantity(quantity - 1)}
                    >
                        <img src={minusIcon} alt="" />
                    </button>
                    <output aria-label="주문 수량">{format(quantity)}</output>
                    <button
                        type="button"
                        className={styles.increase}
                        aria-label="수량 늘리기"
                        disabled={locked || quantity >= limit}
                        onClick={() => onQuantity(quantity + 1)}
                    >
                        <img src={plusIcon} alt="" />
                    </button>
                </div>
            </div>
        </>
    );
}

function MockOrder({ price }) {
    const [side, setSide] = useState("BUY");
    const [quantity, setQuantity] = useState(1);
    const [account, setAccount] = useState({ cash: 1_000_000, shares: 0, cost: 0 });
    const [completed, setCompleted] = useState("");
    const dialogRef = useRef(null);

    const selling = side === "SELL";
    const limit = selling ? account.shares : Math.floor(account.cash / price);
    const orderQuantity = Math.min(quantity, limit);
    const total = orderQuantity * price;
    const averageCost = account.shares ? account.cost / account.shares : 0;

    function submit() {
        if (orderQuantity < 1) return;

        setAccount((previous) => {
            if (selling) {
                const shares = previous.shares - orderQuantity;
                return {
                    cash: previous.cash + total,
                    shares,
                    cost: averageCost * shares,
                };
            }

            return {
                cash: previous.cash - total,
                shares: previous.shares + orderQuantity,
                cost: previous.cost + total,
            };
        });

        setQuantity(1);
        setCompleted(selling ? "매도 완료!" : "매수 완료!");
        dialogRef.current?.showModal();
    }

    return (
        <section className={styles.order} aria-label="예시 종목 주문">
            <OrderFields
                side={side}
                quantity={orderQuantity}
                limit={limit}
                shares={account.shares}
                onSide={(next) => {
                    setSide(next);
                    setQuantity(1);
                }}
                onQuantity={setQuantity}
            />

            <div className={styles.balance}>
                <span>{selling ? "지금 팔면 1주당 손익" : "주문 가능 레이스코인"}</span>
                <strong>
                    {selling
                        ? account.shares ? signed(Math.round(price - averageCost)) : "—"
                        : format(account.cash)}
                </strong>
            </div>

            <p className={styles.notice}>
                <img src={infoIcon} alt="" />
                <span>예시 주문은 화면의 연습용 잔액과 보유 수량에 반영돼요.</span>
            </p>

            <button
                type="button"
                className={`${styles.submit} ${selling ? styles.sell : styles.buy}`}
                disabled={orderQuantity === 0}
                onClick={submit}
            >
                {orderQuantity === 0
                    ? selling ? "매도할 보유 주식이 없어요" : "주문 가능 코인이 부족해요"
                    : `${format(orderQuantity)}주 ${selling ? "팔기" : "사기"} · 총 ${format(total)}`}
            </button>

            <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="mock-order-title">
                <div aria-hidden="true">🏎️</div>
                <h2 id="mock-order-title">{completed}</h2>
                <form method="dialog">
                    <button type="submit">확인</button>
                </form>
            </dialog>
        </section>
    );
}

function LiveOrder({ roundId, stock, accessToken, onExecuted }) {
    const [side, setSide] = useState("BUY");
    const [quantity, setQuantity] = useState(1);
    const [account, setAccount] = useState(null);
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [message, setMessage] = useState("");
    const [portfolioAttempt, setPortfolioAttempt] = useState(0);
    const submitting = useRef(false);
    const driverId = stock.driver.driverId;
    const path = roundPath(roundId);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        const query = new URLSearchParams({ roundId });

        requestMarket(`/me/portfolio?${query}`, { accessToken, signal })
            .then(({ data }) => {
                if (signal.aborted) return;

                const position = data.positions.find(
                    (entry) => entry.driver.driverId === driverId,
                );
                setAccount({ cash: data.cashBalance, shares: position?.quantity ?? 0 });
            })
            .catch((error) => {
                if (!signal.aborted) setMessage(error.message);
            });

        return () => controller.abort();
    }, [accessToken, driverId, roundId, portfolioAttempt]);

    const selling = side === "SELL";
    const limit = account
        ? selling ? account.shares : Math.floor(account.cash / stock.currentPrice)
        : 0;
    const orderQuantity = Math.min(quantity, limit, 2_147_483_647);
    const [completedOrder, setCompletedOrder] = useState("");
    const dialogRef = useRef(null);

    useEffect(() => {
        if (completedOrder && !dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    }, [completedOrder]);

    async function submit() {
        if (submitting.current) return;
        if (!pending && (!stock.tradable || orderQuantity < 1)) return;

        submitting.current = true;
        setBusy(true);
        setMessage("");

        let execution = pending;
        let orderRequested = false;

        try {
            if (!execution) {
                const { data: quote } = await requestMarket(`${path}/quotes`, {
                    accessToken,
                    body: {
                        driverId,
                        side,
                        quantity: orderQuantity,
                    },
                });

                execution = {
                    quote,
                    key: crypto.randomUUID(),
                };
                setPending(execution);
            }

            orderRequested = true;

            const { data: order } = await requestMarket(`${path}/orders`, {
                accessToken,
                orderKey: execution.key,
                body: { quoteId: execution.quote.quoteId },
            });

            setAccount({
                cash: order.cashBalance,
                shares: order.holdingQuantity,
            });
            setPending(null);
            setUncertain(false);
            setQuantity(1);
            setMessage("");
            setCompletedOrder(
                order.type === "SELL" ? "매도 완료!" : "매수 완료!",
            );
            onExecuted(order);
        } catch (error) {
            const unknownResult = orderRequested && (
                !error.code
                || error.status >= 500
                || error.status === 429
                || (uncertain && [401, 403].includes(error.status))
            );

            if (unknownResult) {
                setUncertain(true);
                setMessage(
                    "주문 결과를 확인하지 못했어요. 같은 주문의 결과를 다시 확인해 주세요.",
                );
            } else {
                setPending(null);
                setUncertain(false);
                setMessage(error.message);
            }
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    }

    const estimatedTotal = orderQuantity * stock.currentPrice;

    let buttonLabel = `${format(orderQuantity)}주 ${selling ? "팔기" : "사기"} · 예상 총 ${format(estimatedTotal)}`;

    if (!account) {
        buttonLabel = "보유 자산 확인 중…";
    } else if (orderQuantity < 1) {
        buttonLabel = selling
            ? "매도할 보유 주식이 없어요"
            : "주문 가능 코인이 부족해요";
    }

    if (!stock.tradable) buttonLabel = "거래 마감";
    if (uncertain) buttonLabel = "같은 주문 결과 다시 확인";
    if (busy) buttonLabel = "처리 중…";

    return (
        <section className={styles.order} aria-label="실제 종목 주문">
            <OrderFields
                side={side}
                quantity={orderQuantity}
                limit={Math.min(limit, 2_147_483_647)}
                shares={account?.shares}
                locked={!account || busy || Boolean(pending) || !stock.tradable}
                onSide={(next) => {
                    setSide(next);
                    setQuantity(1);
                }}
                onQuantity={setQuantity}
            />

            <div className={styles.balance}>
                <span>주문 가능 레이스코인</span>
                <strong>{account ? format(account.cash) : "—"}</strong>
            </div>

            <p className={styles.notice}>
                <img src={infoIcon} alt="" />
                <span>
                    {selling
                        ? "매도 금액은 체결 시점의 견적에 따라 정해져요. 매도 후 보유 수량과 레이스코인에 반영됩니다."
                        : "매수 금액은 체결 시점의 견적에 따라 정해져요. 레이스 결과에 따른 정산가는 시작 가격을 기준으로 계산합니다."}
                </span>
            </p>

            <button
                type="button"
                className={`${styles.submit} ${selling ? styles.sell : styles.buy}`}
                disabled={busy || (!pending && (!stock.tradable || orderQuantity < 1))}
                onClick={submit}
            >
                {buttonLabel}
            </button>

            {message && <p role="status">{message}</p>}

            {!account && message && (
                <button
                    type="button"
                    onClick={() => {
                        setMessage("");
                        setPortfolioAttempt((value) => value + 1);
                    }}
                >
                    보유 자산 다시 조회
                </button>
            )}

            <dialog
                ref={dialogRef}
                className={styles.dialog}
                aria-labelledby="live-order-result-title"
                onClose={() => setCompletedOrder("")}
            >
                <div aria-hidden="true">🏎️</div>
                <h2 id="live-order-result-title">{completedOrder}</h2>
                <form method="dialog">
                    <button type="submit">확인</button>
                </form>
            </dialog>
        </section>
    );
}

function DriverDetail({ stock, isMock, history, retryLive, children }) {
    const { isAuthenticated, onLogin } = useMarketAccess();
    const [showLoginGuide, setShowLoginGuide] = useState(false);
    const { driver, baseRank, startingPrice, currentPrice, changeRate, settlementRows } = stock;
    const portrait = getPortrait(driver.name);

    if (showLoginGuide && !isAuthenticated) {
        return <LoginGuide onLogin={onLogin} />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link
                    to="/race-market"
                    className={styles.back}
                    aria-label="드라이버 목록으로 돌아가기"
                >
                    <img src={backButtonIcon} alt="" />
                </Link>
                <h1>{driver.name}</h1>
            </header>

            {isMock && (
                <div className={`${styles.notice} ${styles.mockNotice}`}>
                    <p role="status">예시 데이터로 매수·매도를 체험할 수 있어요.</p>
                    {retryLive && (
                        <button type="button" onClick={retryLive}>실제 데이터 다시 시도</button>
                    )}
                </div>
            )}

            <section className={styles.summary} aria-label="종목 정보">
                {portrait && (
                    <div className={styles.avatar}>
                        <img src={portrait} alt="" />
                    </div>
                )}
                <div>
                    <div className={styles.meta}>
                        {driver.teamName} · 기준 순위 <strong className={styles.rank}>P{baseRank}</strong>
                    </div>
                    <div className={styles.quote}>
                        <strong>{format(currentPrice)}</strong>
                        <span>현재 가격</span>
                    </div>
                    {changeRate !== 0 && (
                        <div className={changeRate > 0 ? styles.positive : undefined}>
                            {changeRate > 0 ? "▲ " : ""}{signed(changeRate)}%
                        </div>
                    )}
                </div>
            </section>

            <PriceChart
                startPrice={startingPrice}
                price={currentPrice}
                isMock={isMock}
                history={history}
            />

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
                        {settlementRows.map(({ finish, score, settlement }) => (
                            <tr key={finish ?? "dnf"}>
                                <th scope="row">
                                    {finish == null
                                        ? "미완주"
                                        : `P${finish}${finish === baseRank ? " (유지)" : ""}`}
                                </th>
                                <td>{signed(score)}</td>
                                <td className={styles.settlementPrice}>{format(settlement)}</td>
                                <td className={styles.settlementDifference}>
                                    {signed(settlement - currentPrice)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {isAuthenticated ? (
                children
            ) : (
                <section className={styles.loginOrder} aria-label="로그인 안내">
                    <button
                        type="button"
                        className={`${styles.submit} ${styles.buy} ${styles.loginButton}`}
                        onClick={() => setShowLoginGuide(true)}
                    >
                        로그인 후 매수하기
                    </button>
                </section>
            )}
        </div>
    );
}

function MockDriverDetail({ driver, rank, retryLive }) {
    const stock = {
        driver: { name: driver.name, teamName: driver.team },
        baseRank: rank,
        startingPrice: driver.startPrice,
        currentPrice: getMockPrice(driver),
        changeRate: driver.change,
        settlementRows: getMockSettlementRows(rank, driver.startPrice),
    };

    return (
        <DriverDetail stock={stock} isMock retryLive={retryLive}>
            <MockOrder price={stock.currentPrice} />
        </DriverDetail>
    );
}

function LiveDriverScreen({ roundId, driverId, accessToken, fallbackDriver }) {
    const [stock, setStock] = useState(null);
    const [history, setHistory] = useState(undefined);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const path = `${roundPath(roundId)}/stocks/${encodeURIComponent(driverId)}`;

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        async function load() {
            try {
                const { data } = await requestMarket(path, { signal });

                if (signal.aborted) return;

                if (!data.driver?.name || !Array.isArray(data.settlementScenarios)) {
                    throw new Error("종목 상세 응답 형식을 확인해 주세요.");
                }

                setStock(data);
            } catch (failure) {
                if (!signal.aborted) setError(failure);
                return;
            }

            try {
                const samples = await loadPriceHistory(path, signal);
                if (!signal.aborted) setHistory(samples);
            } catch {
                if (!signal.aborted) setHistory(null);
            }
        }

        load();
        return () => controller.abort();
    }, [path, attempt]);

    function retry() {
        setError(null);
        setAttempt((value) => value + 1);
    }

    function updatePrice(order) {
        setStock((previous) => ({
            ...previous,
            currentPrice: order.currentPrice,
            changeRate: (order.currentPrice - previous.startingPrice) / previous.startingPrice * 100,
        }));
    }

    if (error) {
        if (fallbackDriver && error.code !== "STOCK_NOT_FOUND") {
            return (
                <MockDriverDetail
                    driver={fallbackDriver}
                    rank={drivers.indexOf(fallbackDriver) + 1}
                    retryLive={retry}
                />
            );
        }

        return (
            <div className={styles.page}>
                <Link to="/race-market">드라이버 목록으로 돌아가기</Link>
                <p role="alert">{error.message}</p>
                <button type="button" onClick={retry}>다시 시도</button>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className={styles.page}>
                <Link to="/race-market">드라이버 목록으로 돌아가기</Link>
                <p role="status">종목 정보를 불러오는 중입니다.</p>
            </div>
        );
    }

    const settlementRows = stock.settlementScenarios.map((scenario) => ({
        finish: scenario.finishRank,
        score: scenario.finalScore,
        settlement: scenario.settlementPrice,
    }));

    return (
        <DriverDetail stock={{ ...stock, settlementRows }} history={history}>
            {accessToken ? (
                <LiveOrder
                    key={accessToken}
                    roundId={roundId}
                    stock={stock}
                    accessToken={accessToken}
                    onExecuted={updatePrice}
                />
            ) : (
                <section className={styles.order} aria-label="실제 종목 주문">
                    <p>{stock.tradable ? "로그인 후 매수·매도할 수 있어요." : "이 라운드의 거래가 마감됐어요."}</p>
                </section>
            )}
        </DriverDetail>
    );
}

export default function RaceMarketDriver({ accessToken = null }) {
    const { driverId } = useParams();
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const roundId = searchParams.get("roundId");

    if (roundId && driverId) {
        const fallbackDriver = drivers.find((entry) => entry.name === state?.driverName);

        return (
            <LiveDriverScreen
                key={`${roundId}:${driverId}`}
                roundId={roundId}
                driverId={driverId}
                accessToken={accessToken}
                fallbackDriver={fallbackDriver}
            />
        );
    }

    const rank = Number(driverId);
    const driver = Number.isInteger(rank) ? drivers[rank - 1] : undefined;

    if (!driver) return <Navigate to="/race-market" replace />;

    return <MockDriverDetail key={rank} driver={driver} rank={rank} />;
}