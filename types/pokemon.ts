export interface PokemonListApiItem {
    name: string;
    url: string;
}

export interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokemonListApiItem[];
}

export interface PokemonListItem {
    id: number;
    name: string;
    typeName: string;
    thumbnailUrl: string;
    url: string;
}

export interface PokemonListPageResult {
    pokemonList: PokemonListItem[];
    hasMore: boolean;
    totalCount: number;
    nextOffset: number;
}

export interface PokemonSpeciesName {
    name: string;
    language: {
        name: string;
    };
}

export interface PokemonSpeciesResponse {
    names?: PokemonSpeciesName[];
    genera?: PokemonSpeciesGenus[];
}

export interface PokemonSpeciesGenus {
    genus: string;
    language: {
        name: string;
    };
}

export interface PokemonTypeResponse {
    types?: PokemonTypeSlot[];
}

export interface PokemonTypeSlot {
    slot: number;
    type: {
        name: string;
    };
}

export interface PokemonTypeResourceResponse {
    pokemon?: Array<{
        pokemon: {
            name: string;
            url: string;
        };
    }>;
}

export interface PokemonStat {
    base_stat: number;
    stat: {
        name: string;
    };
}

export interface PokemonAbility {
    ability: {
        name: string;
        url: string;
    };
    is_hidden: boolean;
}

export interface PokemonFullResponse {
    id: number;
    height: number;
    weight: number;
    types?: PokemonTypeSlot[];
    stats?: PokemonStat[];
    abilities?: PokemonAbility[];
}

export interface PokemonSpeciesFlavorText {
    flavor_text: string;
    language: {
        name: string;
    };
    version: {
        name: string;
    };
}

export interface PokemonSpeciesFullResponse {
    names?: PokemonSpeciesName[];
    genera?: PokemonSpeciesGenus[];
    flavor_text_entries?: PokemonSpeciesFlavorText[];
}

export interface PokemonDetail {
    id: number;
    koreanName: string;
    englishName: string;
    genus: string;
    description: string;
    imageUrl: string;
    types: string[];
    height: number;
    weight: number;
    stats: Array<{ name: string; value: number }>;
    abilities: string[];
}
