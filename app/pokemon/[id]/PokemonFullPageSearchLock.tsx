'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { useRouteSearchAvailability } from '@/components/providers/RouteSearchAvailabilityProvider';

/**
 * /pokemon/[id] 전체 페이지(주소 직접 입력·하드 네비)에만 마운트됨.
 * 인터셉트 모달 경로에서는 이 레이아웃 자체가 안 올라가서 검색은 그대로 둠.
 */
export default function PokemonFullPageSearchLock({
    children,
}: {
    children: ReactNode;
}) {
    const { setHeaderSearchHidden } = useRouteSearchAvailability();

    useLayoutEffect(() => {
        setHeaderSearchHidden(true);
        return () => setHeaderSearchHidden(false);
    }, [setHeaderSearchHidden]);

    return children;
}
