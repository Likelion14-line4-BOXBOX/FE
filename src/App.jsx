import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import BottomNav from "./components/common/BottomNav/BottomNav";
import Home from "./pages/Home/Home";
import TeamRadio from "./pages/TeamRadio/TeamRadio";
import RaceMarket from "./pages/RaceMarket/RaceMarket";
import MyGarage from "./pages/MyGarage/MyGarage";

function AppRoutes() {
  const location = useLocation();

  const view =
    new URLSearchParams(location.search).get("view") || "home";

  const showShadow =
    location.pathname === "/team-radio" &&
    view !== "home";

  return (
    <>
      <main
        className={`content ${showShadow ? "pageShadow" : ""}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team-radio" element={<TeamRadio />} />
          <Route path="/race-market" element={<RaceMarket />} />
          <Route path="/my-garage" element={<MyGarage />} />
        </Routes>
      </main>

      <BottomNav />
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