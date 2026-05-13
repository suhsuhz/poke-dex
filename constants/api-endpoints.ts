const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export const POKEAPI_ENDPOINTS = {
    pokemonList: (limit: number, offset = 0) =>
        `${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
    pokemon: (pokemonId: number) => `${POKEAPI_BASE_URL}/pokemon/${pokemonId}`,
    pokemonSpecies: (pokemonId: number) =>
        `${POKEAPI_BASE_URL}/pokemon-species/${pokemonId}`,
    pokemonType: (typeSlug: string) =>
        `${POKEAPI_BASE_URL}/type/${typeSlug}`,
};
