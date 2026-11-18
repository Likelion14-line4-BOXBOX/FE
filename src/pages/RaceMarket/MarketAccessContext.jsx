import { createContext, useContext } from "react";

const MarketAccessContext = createContext({
    isAuthenticated: false,
    onLogin: () => {},
});

export function MarketAccessProvider({ currentUser, onLogin, children }) {
    return (
        <MarketAccessContext.Provider
            value={{
                isAuthenticated: Boolean(currentUser?.userId),
                onLogin,
            }}
        >
            {children}
        </MarketAccessContext.Provider>
    );
}

export function useMarketAccess() {
    return useContext(MarketAccessContext);
}