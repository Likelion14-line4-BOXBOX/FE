import { createContext, useContext } from "react";

export const MarketAccessContext = createContext({
    isAuthenticated: false,
    onLogin: () => {},
});

export function useMarketAccess() {
    return useContext(MarketAccessContext);
}