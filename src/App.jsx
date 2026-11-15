import {
  BrowserRouter,
  Routes,
  Route,
  useMatch,
  useLocation,
} from "react-router-dom";

import BottomNav from "./components/common/BottomNav/BottomNav";
import Home from "./pages/Home/Home";
import TeamRadio from "./pages/TeamRadio/TeamRadio";
import RaceMarket from "./pages/RaceMarket/RaceMarket";
import RaceMarketBuySell from "./pages/RaceMarket/RaceMarketBuySell";
import { RaceMarketSettlement } from "./pages/RaceMarket/RaceMarketMy";
import MyGarage from "./pages/MyGarage/MyGarage";
import { MOCK_USER } from "./pages/TeamRadio/useTeamRadioData";

function AppRoutes() {
<<<<<<< HEAD
  const driverDetail = useMatch(
    "/race-market/drivers/:driverId",
  );

=======
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const driverDetail = useMatch(
    "/race-market/drivers/:driverId",
  );

>>>>>>> 7686d87 (fix: 공통 화면 그림자 적용 및 실시간 채팅 제외)
  const settlementDetail = useMatch(
    "/race-market/settlements/:roundId",
  );

<<<<<<< HEAD
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const view = params.get("view") || "home";
=======
  const view = params.get("view") || "home";

  const isTeamRadio =
    location.pathname === "/team-radio";

  const radioFocused =
    isTeamRadio &&
    ["post", "write", "search", "chat"].includes(view);

  const garageEditing =
    location.pathname === "/my-garage" &&
    params.get("edit") === "1";

  const hideBottomNav = Boolean(
    driverDetail ||
    settlementDetail ||
    garageEditing ||
    radioFocused
  );

  // 현재 샘플 데이터의 실시간 채팅방 ID: mexico
  const isLiveChat =
    isTeamRadio &&
    view === "chat" &&
    (
      !params.get("race") ||
      params.get("race") === "mexico"
    );
>>>>>>> 7686d87 (fix: 공통 화면 그림자 적용 및 실시간 채팅 제외)

  const showShadow =
    !isLiveChat &&
    (
      hideBottomNav ||
      (isTeamRadio && view !== "home")
    );

  const garageEditing =
    location.pathname === "/my-garage" &&
    params.get("edit") === "1";

  const hideBottomNav =
    driverDetail || settlementDetail || garageEditing;

  return (
    <>
      <main
        className={`content ${showShadow ? "pageShadow" : ""}`}
      >
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

<<<<<<< HEAD
          {/* 비로그인 테스트: null / 로그인 테스트: MOCK_USER */}
          <Route
            path="/team-radio"
            element={<TeamRadio currentUser={MOCK_USER} />}
=======
          <Route
            path="/team-radio"
            element={<TeamRadio />}
>>>>>>> 7686d87 (fix: 공통 화면 그림자 적용 및 실시간 채팅 제외)
          />

          <Route
            path="/race-market"
            element={<RaceMarket />}
          />

          <Route
<<<<<<< HEAD
            path="/race-market/drivers/:driverId"
            element={<RaceMarketBuySell />}
          />

          <Route
            path="/race-market/settlements/:roundId"
            element={<RaceMarketSettlement />}
          />

          <Route
=======
>>>>>>> 7686d87 (fix: 공통 화면 그림자 적용 및 실시간 채팅 제외)
            path="/my-garage"
            element={<MyGarage />}
          />
        </Routes>
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