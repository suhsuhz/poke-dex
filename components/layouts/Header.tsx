'use client';

import PokemonLogoText from '@/components/common/PokemonLogoText';
import { useRouteSearchAvailability } from '@/components/providers/RouteSearchAvailabilityProvider';
import { useEffect, useState, type FormEvent } from 'react';
import TypeFilter from '@/components/common/TypeFilter';
import SearchBar from '@/components/common/SearchBar';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface HeaderSearchFormProps {
    /** URL이 바뀔 때마다 key로 리마운트되어 로컬 입력이 URL과 일치함 */
    initialTypeFromUrl: string;
    initialKeywordFromUrl: string;
    pathname: string;
    router: { push: (href: string) => void };
    /** 다른 쿼리 유지용, 부모가 매 렌더마다 넘김 */
    currentSearchParamsString: string;
}

function HeaderSearchForm({
    initialTypeFromUrl,
    initialKeywordFromUrl,
    pathname,
    router,
    currentSearchParamsString,
}: HeaderSearchFormProps) {
    const [selectedType, setSelectedType] = useState(initialTypeFromUrl);
    const [searchKeyword, setSearchKeyword] = useState(initialKeywordFromUrl);

    const handleTypeChange = (nextType: string) => {
        // 타입만 바꿀 때는 URL을 바꾸지 않음 — Go(폼 제출) 시에만 검색 반영
        setSelectedType(nextType);
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const queryParams = new URLSearchParams(currentSearchParamsString);

        if (selectedType && selectedType !== 'all') {
            queryParams.set('type', selectedType);
        } else {
            queryParams.delete('type');
        }

        const trimmedKeyword = searchKeyword.trim();
        if (trimmedKeyword) {
            queryParams.set('q', trimmedKeyword);
        } else {
            queryParams.delete('q');
        }

        const nextQueryString = queryParams.toString();
        const nextUrl = nextQueryString
            ? `${pathname}?${nextQueryString}`
            : pathname;
        router.push(nextUrl);
    };

    return (
        <form
            className='flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'
            onSubmit={handleSearchSubmit}
        >
            <TypeFilter
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
            />
            <SearchBar
                searchKeyword={searchKeyword}
                onSearchKeywordChange={setSearchKeyword}
            />
        </form>
    );
}

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { isHeaderSearchHidden } = useRouteSearchAvailability();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const typeFromUrl = searchParams.get('type') ?? 'all';
    const keywordFromUrl = searchParams.get('q') ?? '';
    const searchFormRemountKey = JSON.stringify([typeFromUrl, keywordFromUrl]);

    useEffect(() => {
        // 스크롤이 시작되면 헤더 하단 선을 표시
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header
            className={`sticky top-0 z-30 bg-white/90 backdrop-blur transition-[border-color] duration-200 ${
                isScrolled
                    ? 'border-b border-slate-200'
                    : 'border-b border-transparent'
            }`}
        >
            <div className='mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8 lg:px-14 xl:px-20 mb-3'>
                <div className='w-full sm:w-auto'>
                    <PokemonLogoText size='md' />
                </div>
                {isHeaderSearchHidden ? null : (
                    <HeaderSearchForm
                        key={searchFormRemountKey}
                        initialTypeFromUrl={typeFromUrl}
                        initialKeywordFromUrl={keywordFromUrl}
                        pathname={pathname}
                        router={router}
                        currentSearchParamsString={searchParams.toString()}
                    />
                )}
            </div>
            {/* 기술 스택 안내 — 본문과 구분되는 아주 작은 보조 텍스트 */}
            <p className='mx-auto max-w-screen-2xl px-4 pb-3 text-center text-[11px] leading-relaxed text-slate-400 sm:px-8 lg:px-14 xl:px-20'>
                사용기술: Cursor, React, Next.js, Tailwind CSS
            </p>
        </header>
    );
}
