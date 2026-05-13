'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

type RouteSearchAvailabilityContextValue = {
    /** true면 헤더 검색(타입/검색바) 비표시 — /pokemon/[id] 전용 페이지에서만 켬 */
    isHeaderSearchHidden: boolean;
    setHeaderSearchHidden: (hidden: boolean) => void;
};

const RouteSearchAvailabilityContext =
    createContext<RouteSearchAvailabilityContextValue | null>(null);

export function RouteSearchAvailabilityProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isHeaderSearchHidden, setIsHeaderSearchHidden] = useState(false);

    const setHeaderSearchHidden = useCallback((hidden: boolean) => {
        setIsHeaderSearchHidden(hidden);
    }, []);

    const value = useMemo(
        () => ({ isHeaderSearchHidden, setHeaderSearchHidden }),
        [isHeaderSearchHidden, setHeaderSearchHidden],
    );

    return (
        <RouteSearchAvailabilityContext.Provider value={value}>
            {children}
        </RouteSearchAvailabilityContext.Provider>
    );
}

export function useRouteSearchAvailability() {
    const context = useContext(RouteSearchAvailabilityContext);
    if (!context) {
        throw new Error(
            'useRouteSearchAvailability는 RouteSearchAvailabilityProvider 안에서만 사용하세요.',
        );
    }
    return context;
}
