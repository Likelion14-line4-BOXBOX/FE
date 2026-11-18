import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Link,
    Navigate,
    useLocation,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { FavoriteCard } from "../MyGarage/MyGarage";
import LoginRequiredModal from "../../components/common/LoginRequiredModal/LoginRequiredModal";
import { useMarketAccess } from "./MarketAccessContext";
import garageStyles from "../MyGarage/MyGarage.module.scss";
import styles from "./RaceMarketRanking.module.scss";
import backIcon from "../../assets/images/racemarket/back-button.svg";
import leftBracket from "../../assets/images/racemarket/left-bracket.svg";
import rightBracket from "../../assets/images/racemarket/right-bracket.svg";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
    .replace(/(?:\/api)?$/, "/api");

const profileImages = import.meta.glob(
    "../../assets/images/racemarket/default-profile-icons/*.svg",
    { eager: true, query: "?url", import: "default" },
);

const stampImages = import.meta.glob(
    "../../assets/images/mygarage/레이스 스탬프 - *.svg",
    { eager: true, query: "?url", import: "default" },
);

const stampMap = Object.fromEntries(
    Object.entries(stampImages).map(([path, src]) => [
        path.split("/").pop().normalize("NFC"),
        src,
    ]),
);

function fileName(path) {
    return path.split("/").pop().replace(/\.svg$/, "").normalize("NFC");
}

function normalized(value) {
    return (value ?? "").normalize("NFC").replace(/\s/g, "").toLowerCase();
}

const profileMap = Object.fromEntries(
    Object.entries(profileImages).map(([path, url]) => [normalized(fileName(path)), url]),
);

function defaultAvatar(rank) {
    const position = Number(rank);

    if (position === 1) {
        return profileMap["유저랭킹1등"];
    }

    if (position === 2 || position === 3) {
        return profileMap["유저랭킹2,3등"];
    }

    return profileMap["유저랭킹나머지"];
}

const mockUsers = [
    {
        id: "pole-position",
        nickname: "폴포지션내꺼",
        bio: "당신이 레이싱불스를 사랑해야하는 이유",
        returns: [200, 58.4],
        assets: [3_000_000, 3_564_000],
    },
    { id: "toto", nickname: "토토믿는다", returns: [85.2, 62.1], assets: [2_450_000, 3_681_000] },
    { id: "home-racer", nickname: "방구석페독", returns: [71.4, 47.5], assets: [2_600_000, 3_100_000] },
    { id: "hammer-time", nickname: "해머타임기원", returns: [45.3, 34.1], assets: [1_980_000, 2_740_000] },
    { id: "ollie", nickname: "올리아가자", returns: [31.8, 25.7], assets: [1_730_000, 2_080_000] },
    { id: "george", nickname: "조지왕자", returns: [24.6, 30.2], assets: [1_610_000, 2_300_000] },
    { id: "apex", nickname: "에이펙스", returns: [18.2, 15.8], assets: [1_480_000, 1_860_000] },
    { id: "tifosi", nickname: "평생티포시", returns: [11.4, 19.3], assets: [1_350_000, 1_980_000] },
    { id: "pit-wall", nickname: "피트월", returns: [6.3, 8.1], assets: [1_260_000, 1_460_000] },
    { id: "race-day", nickname: "레이스데이", returns: [4.2, 6.5], assets: [1_150_000, 1_280_000] },
    { id: "me", nickname: "나", returns: [3.7, 12.2], assets: [1_037_000, 1_122_000] },
];

const numberFormat = new Intl.NumberFormat("ko-KR");

function formatValue(value, metric) {
    if (value == null) return "—";
    return metric === "assets"
        ? numberFormat.format(value)
        : `${Number(value).toFixed(1)}%`;
}

function getFilters(params) {
    return {
        period: params.get("period") === "season" ? "season" : "round",
        metric: params.get("metric") === "assets" ? "assets" : "returns",
    };
}

async function request(path, accessToken, signal) {
    const response = await fetch(`${apiBase}${path}`, {
        signal,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.data) {
        const error = new Error(
            payload?.error?.message || `정보를 불러오지 못했어요. (${response.status})`,
        );
        error.code = payload?.error?.code;
        throw error;
    }

    return payload.data;
}

async function loadRanking(period, metric, accessToken, signal) {
    const type = metric === "assets"
        ? "ASSET"
        : period === "season" ? "SEASON_RETURN" : "ROUND_RETURN";
    const query = new URLSearchParams({
        scope: period === "season" ? "SEASON" : "ROUND",
        type,
        size: "10",
    });
    const data = await request(`/rankings?${query}`, accessToken, signal);

    if (!Array.isArray(data.items)) {
        throw new Error("랭킹 응답 형식을 확인해 주세요.");
    }

    return {
        items: data.items.map((item) => ({
            id: item.user.userId,
            nickname: item.user.nickname,
            avatarAssetId: item.user.avatarAssetId,
            bio: item.bio ?? "",
            rank: item.rank,
            value: metric === "assets" ? item.totalAssets : item.returnRate,
        })),
        me: data.myRank ? {
            nickname: data.myRank.nickname,
            rank: data.myRank.rank,
            value: metric === "assets"
                ? data.myRank.totalAssets
                : data.myRank.returnRate,
        } : null,
    };
}

function getMockRanking(period, metric) {
    const index = period === "season" ? 1 : 0;
    const ranked = mockUsers
        .map((user) => ({ ...user, value: user[metric][index] }))
        .sort((first, second) => second.value - first.value)
        .map((user, index) => ({ ...user, rank: index + 1 }));

    return {
        items: ranked.slice(0, 10),
        me: ranked.find((user) => user.id === "me"),
    };
}

function Avatar({ user, className }) {
    return (
        <div className={className} aria-hidden="true">
            <img src={defaultAvatar(user.rank)} alt="" />
        </div>
    );
}

function rankingUrl(params) {
    const query = new URLSearchParams(params);
    query.delete("source");
    query.set("tab", "ranking");
    return `/race-market?${query}`;
}

function profileUrl(user, params, isMock) {
    const query = new URLSearchParams(params);
    query.delete("tab");
    query.set("source", isMock ? "mock" : "api");
    return `/race-market/users/${encodeURIComponent(user.id)}?${query}`;
}

function RankingFooter({ me, metric, loading }) {
    const { isAuthenticated, onLogin } = useMarketAccess();
    const root = document.getElementById("root");

    if (!root) return null;

    return createPortal(
        <aside className={styles.rankFooter} aria-label="내 랭킹">
            {!isAuthenticated ? (
                <button type="button" className={styles.joinButton} onClick={onLogin}>
                    로그인 후 참여하기
                </button>
            ) : me ? (
                <div className={styles.myRank}>
                    <strong>내 순위 #{String(me.rank).padStart(3, "0")}</strong>
                    <span>{me.nickname}</span>
                    <b>{formatValue(me.value, metric)}</b>
                </div>
            ) : (
                <div className={styles.emptyRank} role="status">
                    {loading ? "내 순위를 불러오는 중입니다." : "현재 공개된 내 순위가 없습니다."}
                </div>
            )}
        </aside>,
        root,
    );
}

function RankingPage({ period, metric, params, changeFilter, accessToken }) {
    const [result, setResult] = useState({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        loadRanking(period, metric, accessToken, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) {
                    setResult({ status: "success", data });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setResult({ status: "error", error });
                }
            });

        return () => controller.abort();
    }, [period, metric, accessToken, attempt]);

    function retry() {
        setResult({ status: "loading" });
        setAttempt((value) => value + 1);
    }

    const loading = result.status === "loading";
    const unpublished = result.error?.code === "RANKING_NOT_PUBLISHED";
    const isMock = result.status === "error" && !unpublished;
    const data = isMock
        ? getMockRanking(period, metric)
        : result.data ?? { items: [], me: null };
    const leader = data.items[0];
    const label = metric === "assets" ? "총자산" : "수익률";

    function profileLink(user) {
        return {
            to: profileUrl(user, params, isMock),
            state: isMock ? undefined : { rankingUser: user },
        };
    }

    return (
        <section className={styles.ranking} aria-label="유저 랭킹">
            {isMock && (
                <div className={styles.mockNotice}>
                    <p role="status">랭킹 조회에 실패해 예시 데이터를 표시하고 있어요.</p>
                    <button type="button" onClick={retry}>다시 시도</button>
                </div>
            )}

            {leader && (
                <div className={styles.leader}>
                    <div className={styles.leaderScore}>
                        <span>현재 {label} 1등</span>
                        <strong>{formatValue(leader.value, metric)}</strong>
                    </div>
                    <div className={styles.leaderName}>
                        <strong>{leader.nickname}</strong>
                        {leader.bio && <small>{leader.bio}</small>}
                    </div>
                    <Link {...profileLink(leader)}>프로필 보기</Link>
                </div>
            )}

            <div className={styles.periodFilter} role="group" aria-label="랭킹 기간">
                <button
                    type="button"
                    aria-pressed={period === "round"}
                    onClick={() => changeFilter("period", "round")}
                >
                    이번 라운드
                </button>
                <button
                    type="button"
                    aria-pressed={period === "season"}
                    onClick={() => changeFilter("period", "season")}
                >
                    시즌 전체
                </button>
            </div>

            <div className={styles.metricFilter} role="group" aria-label="랭킹 정렬 기준">
                <button
                    type="button"
                    aria-pressed={metric === "returns"}
                    onClick={() => changeFilter("metric", "returns")}
                >
                    수익률
                </button>
                <button
                    type="button"
                    aria-pressed={metric === "assets"}
                    onClick={() => changeFilter("metric", "assets")}
                >
                    총자산
                </button>
            </div>

            {loading && <p role="status">유저 랭킹을 불러오는 중입니다.</p>}

            {unpublished && (
                <div>
                    <p role="status">랭킹이 아직 공개되지 않았어요.</p>
                    <button type="button" onClick={retry}>다시 조회</button>
                </div>
            )}

            {!loading && !unpublished && data.items.length === 0 && (
                <p>공개된 랭킹이 없습니다.</p>
            )}

            <ol className={styles.podium} aria-label="상위 3위">
                {data.items.slice(0, 3).map((user) => (
                    <li key={user.id} data-place={user.rank}>
                        <Link {...profileLink(user)}>
                            <Avatar user={user} className={styles.podiumAvatar} />
                            <strong>{user.nickname}</strong>
                            <small>{label} {formatValue(user.value, metric)}</small>
                            <span className={styles.podiumRank}>{user.rank}</span>
                        </Link>
                    </li>
                ))}
            </ol>

            <ol className={styles.rankList} start={4} aria-label="4위부터 10위">
                {data.items.slice(3, 10).map((user) => (
                    <li key={user.id}>
                        <Link {...profileLink(user)}>
                            <span className={styles.listRank}>{user.rank}</span>
                            <Avatar user={user} className={styles.listAvatar} />
                            <strong>{user.nickname}</strong>
                            <b>{formatValue(user.value, metric)}</b>
                        </Link>
                    </li>
                ))}
            </ol>

            <RankingFooter me={data.me} metric={metric} loading={loading} />
        </section>
    );
}

export function RaceMarketRanking({ accessToken } = {}) {
    const [params, setParams] = useSearchParams();
    const { period, metric } = getFilters(params);

    function changeFilter(key, value) {
        setParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set(key, value);
            return next;
        }, { replace: true });
    }

    return (
        <RankingPage
            key={`${period}:${metric}:${accessToken ?? ""}`}
            period={period}
            metric={metric}
            params={params}
            changeFilter={changeFilter}
            accessToken={accessToken}
        />
    );
}

function StampBoard({ summary }) {
    const watchedCount = summary.watchedCount;
    const totalRaces = summary.totalRaces;
    const stampNumber = Math.min(23, Math.max(0, watchedCount));
    const src = stampMap[`레이스 스탬프 - ${stampNumber}.svg`];

    return (
        <section
            className={garageStyles.stampCard}
            aria-label={`${summary.season} 시즌 ${totalRaces}개 중 ${watchedCount}개 레이스 참여`}
        >
            {src ? (
                <img
                    src={src}
                    alt={`${totalRaces}개 중 ${watchedCount}개 레이스 참여`}
                    className={garageStyles.stampImage}
                />
            ) : (
                <p className={styles.stampFallback}>
                    RACE STAMP · {watchedCount}/{totalRaces}
                </p>
            )}
        </section>
    );
}

function ProfileView({ user, backUrl, garage, isMock, error, retry }) {
    const { onLogin } = useMarketAccess();
    const [modalOpen, setModalOpen] = useState(false);

    const team = garage?.profile.favoriteTeam;
    const driver = garage?.profile.favoriteDriver;
    const market = garage?.marketSummary;
    const summary = garage?.stampSummary;

    function memberAction() {
        setModalOpen(true);
    }

    return (
        <div className={`${garageStyles.page} ${styles.profilePage}`}>
            <header className={styles.profileHeader}>
                <Link to={backUrl} aria-label="유저 랭킹으로 돌아가기">
                    <img src={backIcon} alt="" />
                </Link>
            </header>

            {isMock && <p role="status">예시 프로필을 표시하고 있어요.</p>}

            {error && (
                <div>
                    <p role="alert">{error}</p>
                    {retry && <button type="button" onClick={retry}>다시 조회</button>}
                </div>
            )}

            <section className={styles.profile} aria-labelledby="ranking-profile-name">
                <img className={styles.leftBracket} src={leftBracket} alt="" />
                <Avatar user={user} className={styles.profileAvatar} />
                <div className={styles.profileText}>
                    <h1 id="ranking-profile-name">{user.nickname}</h1>
                    {user.bio && <p>{user.bio}</p>}
                </div>
                <img className={styles.rightBracket} src={rightBracket} alt="" />
            </section>

            <div className={garageStyles.profileActions}>
                <button type="button" onClick={memberAction}>메시지</button>
                <button type="button" onClick={memberAction}>팔로우</button>
            </div>

            {garage ? (
                <>
                    <div className={garageStyles.favorites}>
                        {team ? (
                            <FavoriteCard type="team" name={team.name} rank={team.championshipRank} />
                        ) : (
                            <div className={styles.emptyFavorite}>
                                <strong>MY TEAM</strong>
                                <span>등록된 최애 팀이 없어요.</span>
                            </div>
                        )}

                        {driver ? (
                            <FavoriteCard type="driver" name={driver.name} rank={driver.championshipRank} />
                        ) : (
                            <div className={styles.emptyFavorite}>
                                <strong>MY DRIVER</strong>
                                <span>등록된 최애 드라이버가 없어요.</span>
                            </div>
                        )}
                    </div>

                    <section
                        className={`${garageStyles.marketCard} ${
                            !market ? garageStyles.privateMarketCard : ""
                        }`}
                        aria-label="유저 자산"
                    >
                        <div className={garageStyles.marketHeader}>
                            <h2>MY RACE CART</h2>
                        </div>

                        {market ? (
                            <div className={garageStyles.marketStats}>
                                <div>
                                    <span>총자산</span>
                                    <strong>
                                        {formatValue(market.totalAssets, "assets")}
                                    </strong>
                                </div>

                                <div>
                                    <span>수익률</span>
                                    <strong
                                        className={
                                            market.returnRate > 0
                                                ? garageStyles.positive
                                                : undefined
                                        }
                                        style={
                                            market.returnRate < 0
                                                ? { color: "#0057D9" }
                                                : undefined
                                        }
                                    >
                                        {market.returnRate == null
                                            ? "—"
                                            : `${
                                                market.returnRate > 0
                                                    ? "▲ "
                                                    : market.returnRate < 0 ? "▼ " : ""
                                            }${formatValue(Math.abs(market.returnRate), "returns")}`}
                                    </strong>
                                </div>

                                <div>
                                    <span>유저 랭킹</span>
                                    <strong>
                                        {market.rank == null
                                            ? "—"
                                            : `#${String(market.rank).padStart(3, "0")}`}
                                    </strong>
                                </div>
                            </div>
                        ) : (
                            <div className={garageStyles.privateAssets}>
                                비공개
                            </div>
                        )}
                    </section>

                    {summary && <StampBoard summary={summary} />}
                </>
            ) : !error && (
                <p>최애·자산·참여 기록 상세는 로그인 후 조회할 수 있어요.</p>
            )}

            {modalOpen && (
                <LoginRequiredModal
                    onClose={() => setModalOpen(false)}
                    onLogin={() => {
                        setModalOpen(false);
                        onLogin();
                    }}
                />
            )}
        </div>
    );
}

function mockGarage() {
    return {
        profile: {
            favoriteTeam: {
                name: "레이싱 불스",
                championshipRank: 5,
            },
            favoriteDriver: {
                name: "리암 로슨",
                championshipRank: 9,
            },
        },
        marketSummary: null,
        stampSummary: {
            season: 2026,
            watchedCount: 3,
            totalRaces: 23,
        },
    };
}

function LiveProfile({ userId, period, metric, accessToken, backUrl, initialUser }) {
    const [result, setResult] = useState({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        async function load() {
            try {
                if (!accessToken) {
                    let user = initialUser?.id === userId ? initialUser : null;

                    if (!user) {
                        const ranking = await loadRanking(period, metric, undefined, signal);
                        user = ranking.items.find((entry) => entry.id === userId);
                    }

                    if (!user) throw new Error("현재 상위 랭킹에서 이 유저를 찾을 수 없어요.");

                    if (!signal.aborted) setResult({ status: "success", user });
                    return;
                }

                const garage = await request(
                    `/users/${encodeURIComponent(userId)}/garage`,
                    accessToken,
                    signal,
                );

                if (signal.aborted) return;

                setResult({
                    status: "success",
                    user: {
                        id: garage.profile.userId,
                        nickname: garage.profile.nickname,
                        bio: garage.profile.bio,
                        rank: initialUser?.rank,
                    },
                    garage,
                });
            } catch (error) {
                if (!signal.aborted) setResult({ status: "error", error });
            }
        }

        load();
        return () => controller.abort();
    }, [userId, period, metric, accessToken, initialUser, attempt]);

    function retry() {
        setResult({ status: "loading" });
        setAttempt((value) => value + 1);
    }

    if (result.status === "success") {
        return (
            <ProfileView
                user={result.user}
                garage={result.garage}
                backUrl={backUrl}
            />
        );
    }

    if (result.status === "error" && initialUser?.id === userId) {
        return (
            <ProfileView
                user={initialUser}
                backUrl={backUrl}
                error={result.error.message}
                retry={retry}
            />
        );
    }

    return (
        <div className={`${garageStyles.page} ${styles.profilePage}`}>
            <Link to={backUrl}>유저 랭킹으로 돌아가기</Link>
            <p role={result.status === "error" ? "alert" : "status"}>
                {result.status === "error"
                    ? result.error.message
                    : "프로필을 불러오는 중입니다."}
            </p>
            {result.status === "error" && (
                <button type="button" onClick={retry}>다시 시도</button>
            )}
        </div>
    );
}

export function RaceMarketUserProfile({ accessToken } = {}) {
    const { userId } = useParams();
    const { state } = useLocation();
    const [params] = useSearchParams();
    const { period, metric } = getFilters(params);
    const backUrl = rankingUrl(params);
    const mockIndex = mockUsers.findIndex((user) => user.id === userId);
    const isMock = params.get("source") === "mock"
        || (params.get("source") !== "api" && mockIndex >= 0);

    if (isMock) {
        if (mockIndex < 0) return <Navigate to={backUrl} replace />;

        const ranking = getMockRanking(period, metric);
        const user = ranking.items.find((entry) => entry.id === userId)
            ?? { ...mockUsers[mockIndex], rank: 11 };

        return (
            <ProfileView
                user={user}
                garage={mockGarage(user)}
                backUrl={backUrl}
                isMock
            />
        );
    }

    return (
        <LiveProfile
            key={`${userId}:${period}:${metric}:${accessToken ?? ""}`}
            userId={userId}
            period={period}
            metric={metric}
            accessToken={accessToken}
            backUrl={backUrl}
            initialUser={state?.rankingUser}
        />
    );
}