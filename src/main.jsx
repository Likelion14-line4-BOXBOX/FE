import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import GlobalLoading from "./components/common/LoadingScreen/GlobalLoading";
import { installLoadingFetch } from "./api/loadingFetch";

import "./styles/index.css";
import "./styles/variables.css";
import "@fontsource/bebas-neue";

// 각 화면의 API 요청이 시작되기 전에 설치
installLoadingFetch();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalLoading>
      <App />
    </GlobalLoading>
  </StrictMode>,
);