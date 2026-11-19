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
import { MOCK_USER } from "./pages/TeamRadio/useTeamRadioData";

import RaceMarket from "./pages/RaceMarket/RaceMarket";
import RaceMarketBuySell from "./pages/RaceMarket/RaceMarketBuySell";
import { RaceMarketUserProfile } from "./pages/RaceMarket/RaceMarketRanking";
import { RaceMarketSettlement } from "./pages/RaceMarket/RaceMarketMy";

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

function AppRoutes() {
  // 회원 테스트: MOCK_USER / 비회원 테스트: null
  const currentUser = null;

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

  const isRadioFocused =
    isTeamRadio &&
    RADIO_FOCUSED_VIEWS.includes(view);

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

  const race = params.get("race");

  const isLiveChat =
    isTeamRadio &&
    view === "chat" &&
    (!race || race === "mexico");

  const showShadow =
    !isLiveChat &&
    (hideBottomNav ||
      (isTeamRadio && view !== "home"));

  return (
    <>
      <main
        className={`content${
          showShadow ? " pageShadow" : ""
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Home currentUser={currentUser} />
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
              />
            }
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
            path="/race-market/users/:userId"
            element={<RaceMarketUserProfile />}
          />

          <Route
            path="/race-market/settlements/:roundId"
            element={<RaceMarketSettlement />}
          />

          <Route
            path="/my-garage"
            element={
              <MyGarage
                currentUser={currentUser}
              />
            }
          />

          <Route
            path="/my-garage/radio"
            element={
              <MyRadio
                currentUser={currentUser}
              />
            }
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