import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useMatch,
} from "react-router-dom";

import BottomNav from "./components/common/BottomNav/BottomNav";

import Home from "./pages/Home/Home";
import Messages from "./pages/Home/Messages";

import TeamRadio from "./pages/TeamRadio/TeamRadio";

import RaceMarket from "./pages/RaceMarket/RaceMarket";
import RaceMarketBuySell from "./pages/RaceMarket/RaceMarketBuySell";
import { RaceMarketUserProfile } from "./pages/RaceMarket/RaceMarketRanking";
import { RaceMarketSettlement } from "./pages/RaceMarket/RaceMarketMy";
import { MarketAccessProvider } from "./pages/RaceMarket/MarketAccessContext";

import MyGarage from "./pages/MyGarage/MyGarage";
import MyRadio from "./pages/MyGarage/MyRadio";

const RADIO_FOCUSED_VIEWS = [
  "post",
  "write",
  "search",
  "chat",
];

const GARAGE_PATHS = [
  "/my-garage",
  "/my-garage/radio",
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api")
  .replace(/\/+$/, "")
  .replace(/(?:\/api)?$/, "/api");

function AppRoutes() {
  const [accessToken] = useState(() =>
    sessionStorage.getItem("boxbox_test_access_token"),
  );
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_BASE}/me`, {
          signal: controller.signal,
          credentials: "include",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json();

        if (!response.ok || !payload?.data?.userId) {
          throw new Error(
            payload?.error?.message || "로그인 정보를 확인하지 못했습니다.",
          );
        }

        if (!controller.signal.aborted) {
          setCurrentUser(payload.data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("회원 조회 실패:", error.message);
        }
      }
    }

    loadCurrentUser();
    return () => controller.abort();
  }, [accessToken]);

  const authenticatedToken = currentUser ? accessToken : undefined;

  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const view = params.get("view") || "home";

  const driverDetail = useMatch(
    "/race-market/drivers/:driverId",
  );
  const settlementDetail = useMatch(
    "/race-market/settlements/:roundId",
  );
  const rankingProfile = useMatch(
    "/race-market/users/:userId",
  );

  const isAuthenticated = Boolean(
    currentUser?.userId,
  );
  const isTeamRadio =
    pathname === "/team-radio";
  const isMessages =
    pathname === "/messages";
  const isGarageRadio =
    pathname === "/my-garage/radio";

  const isGarageEditing =
    pathname === "/my-garage" &&
    params.get("edit") === "1";

  const isGarageLoginGuide =
    !isAuthenticated &&
    GARAGE_PATHS.includes(pathname);

  const isRadioChat = isTeamRadio && view === "chat";
  const isRadioFocused =
    isTeamRadio && RADIO_FOCUSED_VIEWS.includes(view);

  const isMarketDetail = Boolean(
    driverDetail ||
      settlementDetail ||
      rankingProfile,
  );

  const hideBottomNav =
    isMessages ||
    isMarketDetail ||
    isRadioFocused ||
    (!isGarageLoginGuide &&
      (isGarageEditing || isGarageRadio));

  const showShadow =
    !isRadioChat &&
    (hideBottomNav || (isTeamRadio && view !== "home"));

  function handleLogin() {
    window.alert("로그인 화면이 아직 연결되지 않았어요.");
  }

  return (
    <>
      <main
        className={`content${showShadow ? " pageShadow" : ""}${isRadioChat ? " radioChatContent" : ""}`}
      >
        <MarketAccessProvider currentUser={currentUser} onLogin={handleLogin}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  currentUser={currentUser}
                  accessToken={authenticatedToken}
                />
              }
            />

            <Route
              path="/messages"
              element={<Messages />}
            />

            <Route
              path="/team-radio"
              element={
                <TeamRadio
                  currentUser={currentUser}
                  accessToken={authenticatedToken}
                />
              }
            />

            <Route
              path="/race-market"
              element={<RaceMarket accessToken={authenticatedToken} />}
            />

            <Route
              path="/race-market/drivers/:driverId"
              element={<RaceMarketBuySell accessToken={authenticatedToken} />}
            />

            <Route
              path="/race-market/users/:userId"
              element={<RaceMarketUserProfile accessToken={authenticatedToken} />}
            />

            <Route
              path="/race-market/settlements/:roundId"
              element={<RaceMarketSettlement accessToken={authenticatedToken} />}
            />

            <Route
              path="/my-garage"
              element={
                <MyGarage
                  currentUser={currentUser}
                  accessToken={authenticatedToken}
                />
              }
            />

            <Route
              path="/my-garage/radio"
              element={<MyRadio currentUser={currentUser} />}
            />
          </Routes>
        </MarketAccessProvider>
      </main>

      {!hideBottomNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
