'use client';

import { DEFAULT_POKEMON_LIST_PAGE_SIZE } from '@/constants/pokemon-list';
import type { PokemonListItem, PokemonListPageResult } from '@/types/pokemon';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PokemonListProps {
    selectedType: string;
    searchKeyword: string;
}

const PAGE_SIZE = DEFAULT_POKEMON_LIST_PAGE_SIZE;

async function fetchPokemonPage(
    offset: number,
    selectedType: string,
    searchKeyword: string,
): Promise<PokemonListPageResult> {
    const requestQueryParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
    });
    const trimmedSearchKeyword = searchKeyword.trim();

    if (selectedType !== 'all') {
        requestQueryParams.set('type', selectedType);
    }

    if (trimmedSearchKeyword) {
        requestQueryParams.set('q', trimmedSearchKeyword);
    }

    const response = await fetch(
        `/api/pokemon?${requestQueryParams.toString()}`,
    );

    if (!response.ok) {
        throw new Error(`포켓몬 페이지 요청 실패: ${response.status}`);
    }

    return (await response.json()) as PokemonListPageResult;
}

export default function PokemonList({
    selectedType,
    searchKeyword,
}: PokemonListProps) {
    const pathname = usePathname();
    // 모달이 열린 상태(URL이 /pokemon/...)에서 다른 카드를 누를 때는 replace로 히스토리를 쌓지 않음 → 뒤로가기 시 직전 모달이 아닌 목록으로 이동
    const shouldReplacePokemonDetailNavigation =
        pathname.startsWith('/pokemon/');

    const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadErrorMessage, setLoadErrorMessage] = useState('');
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const nextOffsetRef = useRef(0);
    const activeRequestIdRef = useRef(0);

    const loadNextPokemonPage = useCallback(
        async (isReset = false) => {
            if (isLoadingRef.current) {
                return;
            }

            if (!isReset && !hasMoreRef.current) {
                return;
            }

            const currentRequestId = activeRequestIdRef.current + 1;
            activeRequestIdRef.current = currentRequestId;
            isLoadingRef.current = true;
            setIsLoading(true);
            setLoadErrorMessage('');

            try {
                const requestOffset = isReset ? 0 : nextOffsetRef.current;
                const pageResult = await fetchPokemonPage(
                    requestOffset,
                    selectedType,
                    searchKeyword,
                );
                if (currentRequestId !== activeRequestIdRef.current) {
                    return;
                }

                setPokemonList((previousPokemonList) =>
                    isReset
                        ? pageResult.pokemonList
                        : [...previousPokemonList, ...pageResult.pokemonList],
                );
                setHasMore(pageResult.hasMore);
                nextOffsetRef.current = pageResult.nextOffset;
                hasMoreRef.current = pageResult.hasMore;
            } catch (error) {
                console.error(
                    '포켓몬 페이지 로딩 중 에러가 발생했습니다.',
                    error,
                );
                setLoadErrorMessage(
                    '포켓몬 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
                );
            } finally {
                if (currentRequestId === activeRequestIdRef.current) {
                    isLoadingRef.current = false;
                }
                setIsLoading(false);
            }
        },
        [searchKeyword, selectedType],
    );

    useEffect(() => {
        nextOffsetRef.current = 0;
        hasMoreRef.current = true;
        setPokemonList([]);
        setHasMore(true);
        void loadNextPokemonPage(true);
    }, [loadNextPokemonPage, selectedType, searchKeyword]);

    useEffect(() => {
        if (!bottomSentinelRef.current) {
            return;
        }

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const [firstEntry] = entries;

                if (!firstEntry?.isIntersecting) {
                    return;
                }

                void loadNextPokemonPage(false);
            },
            {
                root: null,
                rootMargin: '200px 0px',
                threshold: 0,
            },
        );

        intersectionObserver.observe(bottomSentinelRef.current);

        return () => {
            intersectionObserver.disconnect();
        };
    }, [loadNextPokemonPage]);

    if (loadErrorMessage && pokemonList.length === 0) {
        return <p>{loadErrorMessage}</p>;
    }

    return (
        <section aria-label='포켓몬 목록'>
            <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {pokemonList.map((pokemon) => {
                    const filteredPokemonName =
                        pokemon.name.replace(/포켓몬/g, '').trim() ||
                        pokemon.name;

                    return (
                        <li
                            key={pokemon.id}
                            className='group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md'
                        >
                            <Link
                                href={`/pokemon/${pokemon.id}`}
                                replace={shouldReplacePokemonDetailNavigation}
                                className='block'
                            >
                                <div className='relative aspect-square overflow-hidden bg-linear-to-b from-blue-50 to-slate-100'>
                                    {pokemon.thumbnailUrl ? (
                                        <Image
                                            src={pokemon.thumbnailUrl}
                                            alt={pokemon.name}
                                            fill
                                            sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw'
                                            className='object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-110'
                                        />
                                    ) : (
                                        <div className='flex h-full w-full items-center justify-center text-xs text-slate-500'>
                                            이미지 없음
                                        </div>
                                    )}
                                </div>
                                <div className='space-y-1 p-3'>
                                    <p className='text-pokemon-name-size font-bold text-pokemon-name'>
                                        {filteredPokemonName}
                                    </p>
                                    <p className='text-pokemon-type-size font-medium text-black'>
                                        타입: {pokemon.typeName}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {pokemonList.length === 0 && !isLoading ? (
                <p className='mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600'>
                    검색 조건에 맞는 포켓몬이 없습니다.
                </p>
            ) : null}
            {loadErrorMessage && pokemonList.length > 0 ? (
                <p className='mt-4 text-center text-sm text-red-500'>
                    {loadErrorMessage}
                </p>
            ) : null}
            {isLoading ? (
                <div className='mt-2 mb-1 flex h-24 items-center justify-center'>
                    <div
                        className='h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700'
                        aria-label='포켓몬 목록 로딩 중'
                        role='status'
                    />
                </div>
            ) : null}
            {!hasMore && pokemonList.length > 0 ? (
                <p className='py-6 text-center text-sm text-slate-500'>
                    모든 포켓몬을 불러왔습니다.
                </p>
            ) : null}
            <div
                ref={bottomSentinelRef}
                className='h-1 w-full'
                aria-hidden='true'
            />
        </section>
    );
}
