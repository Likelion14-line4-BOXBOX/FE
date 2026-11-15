import { BrowserRouter, Route, Routes, useMatch } from "react-router-dom";
import BottomNav from "./components/common/BottomNav/BottomNav";
import Home from "./pages/Home/Home";
import TeamRadio from "./pages/TeamRadio/TeamRadio";
import RaceMarket from "./pages/RaceMarket/RaceMarket";
import RaceMarketBuySell from "./pages/RaceMarket/RaceMarketBuySell";
import MyGarage from "./pages/MyGarage/MyGarage";
import { MOCK_USER } from "./pages/TeamRadio/useTeamRadioData";

function AppRoutes() {
  const driverDetail = useMatch("/race-market/drivers/:driverId");

  return (
    <>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/team-radio"
            element={<TeamRadio currentUser={MOCK_USER} />} //비로그인: null , 로그인: MOCK_USER
          />
          <Route path="/race-market" element={<RaceMarket />} />
          <Route path="/race-market/drivers/:driverId" element={<RaceMarketBuySell />} />
          <Route path="/my-garage" element={<MyGarage />} />
        </Routes>
      </main>
      {!driverDetail && <BottomNav />}
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