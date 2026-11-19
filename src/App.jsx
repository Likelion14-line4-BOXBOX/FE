import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";

import BottomNav from "./components/common/BottomNav/BottomNav";

import Home from "./pages/Home/Home";
import Messages from "./pages/Home/Messages";

import TeamRadio from "./pages/TeamRadio/TeamRadio";
import Experience from "./pages/Experience/Experience";
import { enterDemo, leaveDemo, readExperience, refreshDemo, saveExperience } from "./shared/demoAuth";

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

function AppRoutes() {
  const [experience, setExperience] = useState(readExperience);
  const navigate = useNavigate();
  const currentUser = experience?.mode === "member" ? experience.user : null;
  const accessToken = experience?.mode === "member" ? experience.accessToken : null;
  const onLogin = () => navigate("/experience");

  useEffect(() => {
    if (experience?.mode !== "member") return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const refreshed = await refreshDemo(experience);
        if (active) {
          saveExperience(refreshed);
          setExperience(refreshed);
        }
      } catch {
        if (active) {
          saveExperience(null);
          setExperience(null);
        }
      }
    }, Math.max(0, experience.expiresAt - Date.now() - 60000));
    return () => { active = false; window.clearTimeout(timer); };
  }, [experience]);

  async function onMember() {
    const member = await enterDemo();
    saveExperience(member);
    setExperience(member);
    navigate("/", { replace: true });
  }

  function onGuest() {
    saveExperience({ mode: "guest" });
    setExperience({ mode: "guest" });
    navigate("/", { replace: true });
    void leaveDemo().catch(() => {
      // 비회원 화면에서는 access token을 전달하지 않는다.
    });
  }

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

  if (!experience || pathname === "/experience") {
    return <Experience onMember={onMember} onGuest={onGuest} />;
  }

  return (
    <>
      <main
        className={`content${showShadow ? " pageShadow" : ""}${isRadioChat ? " radioChatContent" : ""}`}
      >
        <MarketAccessProvider currentUser={currentUser} onLogin={onLogin}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  currentUser={currentUser}
                  accessToken={accessToken}
                  onLogin={onLogin}
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
                  accessToken={accessToken}
                  onLogin={onLogin}
                />
              }
            />

            <Route
              path="/race-market"
              element={<RaceMarket accessToken={accessToken} />}
            />

            <Route
              path="/race-market/drivers/:driverId"
              element={<RaceMarketBuySell accessToken={accessToken} />}
            />

            <Route
              path="/race-market/users/:userId"
              element={<RaceMarketUserProfile accessToken={accessToken} />}
            />

            <Route
              path="/race-market/settlements/:roundId"
              element={<RaceMarketSettlement accessToken={accessToken} />}
            />

            <Route
              path="/my-garage"
              element={
                <MyGarage
                  currentUser={currentUser}
                  accessToken={accessToken}
                  onLogin={onLogin}
                />
              }
            />

            <Route
              path="/my-garage/radio"
              element={<MyRadio currentUser={currentUser} onLogin={onLogin} />}
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
