import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "./components/common/BottomNav/BottomNav";
import Home from "./pages/Home/Home";
import TeamRadio from "./pages/TeamRadio/TeamRadio";
import RaceMarket from "./pages/RaceMarket/RaceMarket";
import MyGarage from "./pages/MyGarage/MyGarage";

export default function App() {
  return (
    <BrowserRouter>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team-radio" element={<TeamRadio />} />
          <Route path="/race-market" element={<RaceMarket />} />
          <Route path="/my-garage" element={<MyGarage />} />
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  );
}