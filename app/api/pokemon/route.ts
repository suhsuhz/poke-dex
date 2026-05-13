import {
    DEFAULT_POKEMON_LIST_PAGE_SIZE,
    MAX_POKEMON_LIST_PAGE_LIMIT,
} from '@/constants/pokemon-list';
import { fetchPokemonListPage } from '@/lib/api/pokemon';
import { NextResponse } from 'next/server';

function parsePositiveInteger(
    rawValue: string | null,
    fallbackValue: number,
): number {
    if (!rawValue) {
        return fallbackValue;
    }

    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
        return fallbackValue;
    }

    return Math.max(0, Math.floor(parsedValue));
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const requestedLimit = parsePositiveInteger(
        requestUrl.searchParams.get('limit'),
        DEFAULT_POKEMON_LIST_PAGE_SIZE,
    );
    const requestedOffset = parsePositiveInteger(
        requestUrl.searchParams.get('offset'),
        0,
    );
    const selectedType = requestUrl.searchParams.get('type') ?? 'all';
    const searchKeyword = requestUrl.searchParams.get('q') ?? '';
    const safeLimit = Math.min(
        Math.max(1, requestedLimit),
        MAX_POKEMON_LIST_PAGE_LIMIT,
    );

    const pageResult = await fetchPokemonListPage({
        limit: safeLimit,
        offset: requestedOffset,
        selectedType,
        searchKeyword,
    });

    return NextResponse.json(pageResult);
}
