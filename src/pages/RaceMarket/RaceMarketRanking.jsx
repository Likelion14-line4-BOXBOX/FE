import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { FavoriteCard } from "../MyGarage/MyGarage";
import garageStyles from "../MyGarage/MyGarage.module.scss";
import backIcon from "../../assets/images/racemarket/back-button.svg";
import leftBracket from "../../assets/images/racemarket/left-bracket.svg";
import rightBracket from "../../assets/images/racemarket/right-bracket.svg";
import profileImage from "../../assets/images/racemarket/profile-img.svg";
import stampImage from "../../assets/images/mygarage/레이스 스탬프 - 3.svg";
import styles from "./RaceMarketRanking.module.scss";
import LoginRequiredModal from "../../components/common/LoginRequiredModal/LoginRequiredModal";
import { useMarketAccess } from "./MarketAccessContext";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
    .replace(/(?:\/api)?$/, "/api");

const mockUsers = [
    {
        id: "pole-position",
        nickname: "폴포지션내꺼",
        bio: "당신이 레이싱불스를 사랑해야하는 이유는 바",
        avatar: profileImage,
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

const favoriteTeams = [
    { name: "레이싱 불스", rank: 5, driver: "리암 로슨", driverRank: 9 },
    { name: "메르세데스", rank: 3, driver: "조지 러셀", driverRank: 4 },
    { name: "페라리", rank: 2, driver: "루이스 해밀턴", driverRank: 7 },
];

const coinFormat = new Intl.NumberFormat("ko-KR");

function formatValue(value, metric) {
    return metric === "assets" ? coinFormat.format(value) : `${value.toFixed(1)}%`;
}

function getMockRanking(period, metric) {
    const index = period === "season" ? 1 : 0;
    const ranked = mockUsers
        .map((user) => ({ ...user, value: user[metric][index] }))
        .sort((first, second) => second.value - first.value)
        .map((user, position) => ({ ...user, rank: position + 1 }));

    return {
        items: ranked.slice(0, 10),
        me: ranked.find((user) => user.id === "me"),
    };
}

async function loadRanking(period, metric, accessToken, signal) {
    // RM12 구현이 나오면 요청 파라미터와 응답 매핑을 실제 계약에 맞춥니다.
    const query = new URLSearchParams({
        period: period === "season" ? "SEASON" : "ROUND",
        metric: metric === "assets" ? "TOTAL_ASSETS" : "RETURN_RATE",
    });

    const response = await fetch(`${apiBase}/rankings?${query}`, {
        signal,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error?.message || "랭킹을 불러오지 못했어요.");
    }

    const { items, me } = payload?.data ?? {};

    if (!Array.isArray(items)) {
        throw new Error("랭킹 응답 형식을 확인해 주세요.");
    }

    function mapUser(user) {
        if (
            typeof user?.userId !== "string"
            || typeof user.nickname !== "string"
            || !Number.isInteger(user.rank)
            || user.rank < 1
            || !Number.isFinite(user.value)
        ) {
            throw new Error("랭킹 항목 응답 형식을 확인해 주세요.");
        }

        return {
            id: user.userId,
            nickname: user.nickname,
            bio: typeof user.bio === "string" ? user.bio : "",
            rank: user.rank,
            value: user.value,
        };
    }

    return {
        items: items.map(mapUser),
        me: me == null ? null : mapUser(me),
    };
}

function useRanking(period, metric, accessToken) {
    const [result, setResult] = useState({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        loadRanking(period, metric, accessToken, signal)
            .then((data) => {
                if (!signal.aborted) setResult({ status: "success", data });
            })
            .catch((error) => {
                if (!signal.aborted) setResult({ status: "error", error });
            });

        return () => controller.abort();
    }, [period, metric, accessToken, attempt]);

    function retry() {
        setResult({ status: "loading" });
        setAttempt((value) => value + 1);
    }

    return { ...result, retry };
}

function getFilters(searchParams) {
    return {
        period: searchParams.get("period") === "season" ? "season" : "round",
        metric: searchParams.get("metric") === "assets" ? "assets" : "returns",
    };
}

function rankingUrl(searchParams) {
    const query = new URLSearchParams(searchParams);
    query.delete("source");
    query.set("tab", "ranking");
    return `/race-market?${query}`;
}

function profileUrl(user, searchParams, isMock) {
    const query = new URLSearchParams(searchParams);
    query.delete("tab");

    if (isMock) {
        query.delete("source");
    } else {
        query.set("source", "api");
    }

    const search = query.toString();
    return `/race-market/users/${encodeURIComponent(user.id)}${search ? `?${search}` : ""}`;
}

function Avatar({ user, className }) {
    return (
        <div className={className} aria-hidden="true">
            {user.avatar ? <img src={user.avatar} alt="" /> : <span>{user.nickname[0]}</span>}
        </div>
    );
}

function RankingResults({ period, metric, accessToken, searchParams }) {
    const { isAuthenticated, onLogin } = useMarketAccess();
    const result = useRanking(period, metric, accessToken);

    if (result.status === "loading") {
        return <p role="status">유저 랭킹을 불러오는 중입니다.</p>;
    }

    const isMock = result.status === "error";
    const { items, me } = isMock ? getMockRanking(period, metric) : result.data;
    const leader = items[0];
    const metricLabel = metric === "assets" ? "총자산" : "수익률";

    return (
        <>
            {isMock && (
                <div>
                    <p role="status">실제 랭킹을 불러오지 못해 예시 데이터를 표시하고 있어요.</p>
                    <button type="button" onClick={result.retry}>다시 시도</button>
                </div>
            )}

            {leader ? (
                <>
                    <div className={styles.leader}>
                        <div className={styles.leaderScore}>
                            <span>현재 {metricLabel} 1등</span>
                            <strong>{formatValue(leader.value, metric)}</strong>
                        </div>
                        <div className={styles.leaderName}>
                            <strong>{leader.nickname}</strong>
                            {leader.bio && <small>{leader.bio}</small>}
                        </div>
                        <Link to={profileUrl(leader, searchParams, isMock)}>프로필 보기</Link>
                    </div>

                    <ol className={styles.podium} aria-label="상위 3위">
                        {items.slice(0, 3).map((user) => (
                            <li key={user.id} data-place={user.rank}>
                                <Link
                                    to={profileUrl(user, searchParams, isMock)}
                                    aria-label={`${user.rank}위 ${user.nickname} 프로필 보기`}
                                >
                                    <Avatar user={user} className={styles.podiumAvatar} />
                                    <strong>{user.nickname}</strong>
                                    <small>{metricLabel} {formatValue(user.value, metric)}</small>
                                    <span className={styles.podiumRank}>{user.rank}</span>
                                </Link>
                            </li>
                        ))}
                    </ol>

                    {items.length > 3 && (
                        <ol className={styles.rankList} start={4} aria-label="4위부터 10위">
                            {items.slice(3, 10).map((user) => (
                                <li key={user.id}>
                                    <Link to={profileUrl(user, searchParams, isMock)}>
                                        <span className={styles.listRank}>{user.rank}</span>
                                        <Avatar user={user} className={styles.listAvatar} />
                                        <strong>{user.nickname}</strong>
                                        <b>{formatValue(user.value, metric)}</b>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    )}
                </>
            ) : (
                <p>공개된 랭킹이 없습니다.</p>
            )}

            {!isAuthenticated ? (
                <button
                    type="button"
                    className={styles.joinButton}
                    onClick={onLogin}
                >
                    로그인 후 참여하기
                </button>
            ) : me ? (
                <div className={styles.myRank}>
                    <strong>내 순위 #{String(me.rank).padStart(3, "0")}</strong>
                    <span>{me.nickname}</span>
                    <b>{metricLabel} {formatValue(me.value, metric)}</b>
                </div>
            ) : null}
        </>
    );
}

export function RaceMarketRanking({ accessToken } = {}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { period, metric } = getFilters(searchParams);

    function changeFilter(key, value) {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set(key, value);
            return next;
        }, { replace: true });
    }

    return (
        <section className={styles.ranking} aria-label="유저 랭킹">
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

            <RankingResults
                key={`${period}:${metric}:${accessToken ?? ""}`}
                period={period}
                metric={metric}
                accessToken={accessToken}
                searchParams={searchParams}
            />
        </section>
    );
}

function ProfileHeader({ backUrl }) {
    return (
        <header className={styles.profileHeader}>
            <Link to={backUrl} aria-label="유저 랭킹으로 돌아가기">
                <img src={backIcon} alt="" />
            </Link>
        </header>
    );
}

function ProfileView({ user, backUrl, favorite }) {
    const { isAuthenticated, onLogin } = useMarketAccess();
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    function requestMemberAction() {
        if (!isAuthenticated) {
            setLoginModalOpen(true);
        }
    }

    function handleLogin() {
        setLoginModalOpen(false);
        onLogin();
    }

    return (
        <div className={`${garageStyles.page} ${styles.profilePage}`}>
            <ProfileHeader backUrl={backUrl} />

            {favorite && <p role="status">예시 프로필을 표시하고 있어요.</p>}

            <section className={styles.profile} aria-labelledby="ranking-profile-name">
                <img className={styles.leftBracket} src={leftBracket} alt="" />
                <Avatar user={user} className={garageStyles.avatar} />
                <div className={garageStyles.profileText}>
                    <h1 id="ranking-profile-name">{user.nickname}</h1>
                    {user.bio && <p>{user.bio}</p>}
                    {favorite && (
                        <div className={garageStyles.followInfo}>
                            <span>팔로잉 1</span>
                            <span>팔로워 1</span>
                        </div>
                    )}
                </div>
                <img className={styles.rightBracket} src={rightBracket} alt="" />
            </section>

            {favorite && (
                <>
                    <div className={garageStyles.profileActions}>
                        <button
                            type="button"
                            disabled={isAuthenticated}
                            onClick={requestMemberAction}
                        >
                            메시지
                        </button>
                        <button
                            type="button"
                            disabled={isAuthenticated}
                            onClick={requestMemberAction}
                        >
                            팔로우
                        </button>
                    </div>

                    <div className={garageStyles.favorites}>
                        <FavoriteCard type="team" name={favorite.name} rank={favorite.rank} />
                        <FavoriteCard type="driver" name={favorite.driver} rank={favorite.driverRank} />
                    </div>

                    <section className={garageStyles.marketCard} aria-labelledby="ranking-race-cart">
                        <div className={garageStyles.marketHeader}>
                            <h2 id="ranking-race-cart">MY RACE CART</h2>
                        </div>
                        <div className={garageStyles.privateAssets}>비공개</div>
                    </section>

                    <section className={garageStyles.stampCard} aria-label="23개 중 3개 레이스 참여">
                        <img className={garageStyles.stampImage} src={stampImage} alt="레이스 스탬프" />
                    </section>
                </>
            )}

            {loginModalOpen && (
                <LoginRequiredModal
                    onClose={() => setLoginModalOpen(false)}
                    onLogin={handleLogin}
                />
            )}
        </div>
    );
}

function LiveProfile({ userId, period, metric, accessToken, backUrl }) {
    const result = useRanking(period, metric, accessToken);

    if (result.status === "success") {
        const { items, me } = result.data;
        const user = items.find((entry) => entry.id === userId)
            ?? (me?.id === userId ? me : null);

        if (user) return <ProfileView user={user} backUrl={backUrl} />;
    }

    return (
        <div className={`${garageStyles.page} ${styles.profilePage}`}>
            <ProfileHeader backUrl={backUrl} />

            {result.status === "loading" && <p role="status">프로필을 불러오는 중입니다.</p>}

            {result.status === "error" && (
                <>
                    <p role="alert">{result.error.message}</p>
                    <button type="button" onClick={result.retry}>다시 시도</button>
                </>
            )}

            {result.status === "success" && <p>현재 랭킹에서 이 유저를 찾을 수 없어요.</p>}
        </div>
    );
}

export function RaceMarketUserProfile({ accessToken } = {}) {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const backUrl = rankingUrl(searchParams);
    const { period, metric } = getFilters(searchParams);

    if (searchParams.get("source") === "api") {
        return (
            <LiveProfile
                key={`${userId}:${period}:${metric}:${accessToken ?? ""}`}
                userId={userId}
                period={period}
                metric={metric}
                accessToken={accessToken}
                backUrl={backUrl}
            />
        );
    }

    const index = mockUsers.findIndex((user) => user.id === userId);

    if (index < 0) return <Navigate to={backUrl} replace />;

    return (
        <ProfileView
            user={mockUsers[index]}
            backUrl={backUrl}
            favorite={favoriteTeams[index % favoriteTeams.length]}
        />
    );
}