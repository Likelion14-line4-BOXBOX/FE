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
import MyRadio from "./pages/MyGarage/MyRadio";
import { MOCK_USER } from "./pages/TeamRadio/useTeamRadioData";

function AppRoutes() {
  // 회원 테스트: MOCK_USER / 비회원 테스트: null
  const currentUser = null;

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

  const garageRadio =
    location.pathname === "/my-garage/radio";

  const isLoginGuide =
    !currentUser?.userId &&
    ["/my-garage", "/my-garage/radio"].includes(
      location.pathname,
    );

  const hideBottomNav =
    !isLoginGuide &&
    Boolean(
      driverDetail ||
      settlementDetail ||
      garageEditing ||
      garageRadio ||
      radioFocused
    );

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
            element={<Home currentUser={currentUser} />}
          />

          <Route
            path="/team-radio"
            element={<TeamRadio currentUser={currentUser} />}
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
            path="/my-garage/radio"
            element={<MyRadio currentUser={currentUser} />}
          />

          <Route
            path="/my-garage"
            element={<MyGarage currentUser={currentUser} />}
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