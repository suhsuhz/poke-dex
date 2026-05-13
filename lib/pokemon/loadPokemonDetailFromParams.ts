import { fetchPokemonDetail } from '@/lib/api/pokemon';
import type { PokemonDetail } from '@/types/pokemon';
import { notFound } from 'next/navigation';

/** 모달·전체 상세 페이지 공통 라우트 params */
export type PokemonDetailRouteParams = Promise<{ id: string }>;

/**
 * /pokemon/[id] 모달·전체 페이지 공통: 라우트 params에서 상세를 불러오고, 잘못된 ID·미존재 시 notFound
 */
export async function loadPokemonDetailFromParams(
    params: PokemonDetailRouteParams,
): Promise<PokemonDetail> {
    const { id } = await params;
    const pokemonId = Number(id);

    if (Number.isNaN(pokemonId) || pokemonId < 1) {
        notFound();
    }

    const pokemon = await fetchPokemonDetail(pokemonId);

    if (!pokemon) {
        notFound();
    }

    return pokemon;
}
