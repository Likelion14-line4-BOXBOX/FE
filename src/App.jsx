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
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const driverDetail = useMatch(
    "/race-market/drivers/:driverId",
  );

  const settlementDetail = useMatch(
    "/race-market/settlements/:roundId",
  );

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

  // 현재 샘플 데이터에서 실시간 채팅방 ID는 mexico입니다.
  const isLiveChat =
    isTeamRadio &&
    view === "chat" &&
    (
      !params.get("race") ||
      params.get("race") === "mexico"
    );

  const showShadow =
    !isLiveChat &&
    (
      hideBottomNav ||
      (isTeamRadio && view !== "home")
    );

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

          {/* 비로그인 테스트: null / 로그인 테스트: MOCK_USER */}
          <Route
            path="/team-radio"
            element={<TeamRadio currentUser={MOCK_USER} />}
          />

          <Route
            path="/race-market"
            element={<RaceMarket />}
          />

          <Route
            path="/race-market/drivers/:driverId"
            element={<RaceMarketBuySell />}
          />

          <Route
            path="/race-market/settlements/:roundId"
            element={<RaceMarketSettlement />}
          />

          <Route
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