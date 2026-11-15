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

function AppRoutes() {
  const driverDetail = useMatch(
    "/race-market/drivers/:driverId",
  );

  const settlementDetail = useMatch(
    "/race-market/settlements/:roundId",
  );

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const view = params.get("view") || "home";

  const showShadow =
    location.pathname === "/team-radio" &&
    view !== "home";

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

          <Route
            path="/team-radio"
            element={<TeamRadio />}
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