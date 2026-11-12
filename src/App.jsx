import { BrowserRouter, Route, Routes, useMatch } from "react-router-dom";
import BottomNav from "./components/common/BottomNav/BottomNav";
import Home from "./pages/Home/Home";
import TeamRadio from "./pages/TeamRadio/TeamRadio";
import RaceMarket from "./pages/RaceMarket/RaceMarket";
import RaceMarketBuySell from "./pages/RaceMarket/RaceMarketBuySell";
import MyGarage from "./pages/MyGarage/MyGarage";

function AppRoutes() {
  const driverDetail = useMatch("/race-market/drivers/:driverId");

  return (
    <>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team-radio" element={<TeamRadio />} />
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