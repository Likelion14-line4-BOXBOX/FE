import { MarketAccessContext } from "./marketAccess";

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