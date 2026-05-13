import { POKEAPI_ENDPOINTS } from '@/constants/api-endpoints';
import { DEFAULT_POKEMON_LIST_PAGE_SIZE } from '@/constants/pokemon-list';
import { POKEMON_TYPE_NAME_MAP } from '@/constants/pokemon-types';
import type {
    PokemonListItem,
    PokemonListPageResult,
    PokemonListResponse,
    PokemonListApiItem,
    PokemonSpeciesResponse,
    PokemonTypeResourceResponse,
    PokemonTypeResponse,
    PokemonFullResponse,
    PokemonSpeciesFullResponse,
    PokemonDetail,
} from '@/types/pokemon';

/**
 * 주소에서 포켓몬 ID만 추출
 * @param pokemonUrl 포켓몬 URL
 * @returns 포켓몬 ID
 */
function parsePokemonIdFromUrl(pokemonUrl: string): number | null {
    const matchedId = pokemonUrl.match(/\/pokemon\/(\d+)\/?$/);

    if (!matchedId) {
        return null;
    }

    const parsedId = Number(matchedId[1]);
    return Number.isNaN(parsedId) ? null : parsedId;
}

/**
 * 포켓몬 리스트 API 응답 데이터를 포켓몬 리스트 데이터로 변환
 * @param apiItem 포켓몬 리스트 API 응답 데이터
 * @returns 포켓몬 리스트 데이터
 */
function mapPokemonListItem(
    apiItem: PokemonListApiItem,
): PokemonListItem | null {
    const parsedPokemonId = parsePokemonIdFromUrl(apiItem.url);

    if (!parsedPokemonId) {
        return null;
    }

    return {
        id: parsedPokemonId,
        name: apiItem.name,
        typeName: '타입 정보 없음',
        thumbnailUrl: '',
        url: apiItem.url,
    };
}

interface PokemonListDetailData {
    name: string;
    typeName: string;
    thumbnailUrl: string;
}

const POKEMON_LIST_DETAIL_CONCURRENCY = 5;
/** 타입 API로 후보가 줄었을 때 상세 조회 동시성 (물+이름 검색 등 체감 속도) */
const POKEMON_TYPE_FILTER_DETAIL_CONCURRENCY = 8;
/** 한글 검색(타입 전체): species 1회/마리 스캔 시 동시성 */
const POKEMON_SPECIES_NAME_SCAN_CONCURRENCY = 24;

/** PokeAPI 전체 마릿수 캐시 — 도감 번호 상한 스캔에 사용 */
let cachedNationalDexPokemonCount: number | null = null;

/**
 * 포켓몬 공식 아트워크 URL 생성
 * @param pokemonId 포켓몬 ID
 * @returns 썸네일 URL
 */
function buildPokemonThumbnailUrl(pokemonId: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

/**
 * 포켓몬 타입명을 한글로 변환
 * @param englishTypeName 영문 타입명
 * @returns 한글 타입명
 */
function getKoreanPokemonTypeName(englishTypeName: string): string {
    return POKEMON_TYPE_NAME_MAP[englishTypeName] ?? englishTypeName;
}

/**
 * 배열을 동시성 제한으로 순회하며 비동기 처리
 * @param items 처리할 배열
 * @param concurrency 동시에 실행할 작업 수
 * @param mapper 각 아이템 비동기 처리 함수
 * @returns 처리 결과 배열
 */
async function mapWithConcurrencyLimit<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const limitedConcurrency = Math.max(1, Math.floor(concurrency));
    const mappedResults: R[] = new Array(items.length);
    let nextItemIndex = 0;

    async function runWorker() {
        while (nextItemIndex < items.length) {
            const currentItemIndex = nextItemIndex;
            nextItemIndex += 1;
            mappedResults[currentItemIndex] = await mapper(
                items[currentItemIndex],
                currentItemIndex,
            );
        }
    }

    const workerCount = Math.min(limitedConcurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

    return mappedResults;
}

/**
 * 포켓몬 리스트용 한국어 데이터 상세 조회
 * @param pokemonId 포켓몬 ID
 * @param fallbackName 포켓몬 한국어 이름이 없을 경우 사용할 이름
 * @returns
 */
async function fetchPokemonListDetail(
    pokemonId: number,
    fallbackName: string,
): Promise<PokemonListDetailData> {
    const defaultDetailData: PokemonListDetailData = {
        name: fallbackName,
        typeName: '타입 정보 없음',
        thumbnailUrl: buildPokemonThumbnailUrl(pokemonId),
    };

    try {
        const [speciesResponse, pokemonResponse] = await Promise.all([
            fetch(POKEAPI_ENDPOINTS.pokemonSpecies(pokemonId), {
                // 포켓몬 한글 이름
                next: {
                    revalidate: 86400,
                    tags: [`pokemon-species-${pokemonId}`],
                },
            }),
            fetch(POKEAPI_ENDPOINTS.pokemon(pokemonId), {
                // 포켓몬 타입
                next: {
                    revalidate: 86400,
                    tags: [`pokemon-type-${pokemonId}`],
                },
            }),
        ]);

        const speciesData = speciesResponse.ok
            ? ((await speciesResponse.json()) as PokemonSpeciesResponse)
            : null;
        const pokemonTypeData = pokemonResponse.ok
            ? ((await pokemonResponse.json()) as PokemonTypeResponse)
            : null;

        // 포켓몬 한글 이름
        const koreanName =
            speciesData?.names?.find(
                (nameEntry) => nameEntry.language.name === 'ko',
            )?.name ?? fallbackName;
        // 포켓몬 대표 타입(첫 번째 슬롯) 추출
        const primaryTypeName =
            pokemonTypeData?.types
                ?.slice()
                .sort(
                    (firstType, secondType) => firstType.slot - secondType.slot,
                )[0]?.type.name ?? '';
        const koreanTypeName = primaryTypeName
            ? getKoreanPokemonTypeName(primaryTypeName)
            : defaultDetailData.typeName;

        return {
            name: koreanName,
            typeName: koreanTypeName,
            thumbnailUrl: defaultDetailData.thumbnailUrl,
        };
    } catch (error) {
        console.error(
            `포켓몬 상세 데이터(${pokemonId}) 조회 중 에러가 발생했습니다.`,
            error,
        );
        return defaultDetailData;
    }
}

/**
 * 포켓몬 목록 조회
 * @param limit 포켓몬 목록 개수
 * @returns 포켓몬 목록
 */
export async function fetchPokemonList(
    limit = DEFAULT_POKEMON_LIST_PAGE_SIZE,
): Promise<PokemonListItem[]> {
    const firstPageResult = await fetchPokemonListPage({ limit, offset: 0 });
    return firstPageResult.pokemonList;
}

interface FetchPokemonListPageOptions {
    limit: number;
    offset: number;
    selectedType?: string;
    searchKeyword?: string;
}

export async function fetchPokemonListPage({
    limit,
    offset,
    selectedType = 'all',
    searchKeyword = '',
}: FetchPokemonListPageOptions): Promise<PokemonListPageResult> {
    const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();
    const englishTypeSlug =
        selectedType !== 'all' && POKEMON_TYPE_NAME_MAP[selectedType]
            ? selectedType
            : null;
    const selectedTypeName = englishTypeSlug
        ? POKEMON_TYPE_NAME_MAP[englishTypeSlug]
        : null;

    if (!selectedTypeName && !normalizedSearchKeyword) {
        return fetchRawPokemonListPage({ limit, offset });
    }

    return fetchFilteredPokemonListPage({
        limit,
        offset,
        selectedTypeName,
        englishTypeSlug,
        normalizedSearchKeyword,
    });
}

function isMatchedPokemon({
    pokemon,
    selectedTypeName,
    normalizedSearchKeyword,
}: {
    pokemon: PokemonListItem;
    selectedTypeName: string | null;
    normalizedSearchKeyword: string;
}): boolean {
    const isTypeMatched = selectedTypeName
        ? pokemon.typeName === selectedTypeName
        : true;
    const pokemonNameForSearch =
        pokemon.name.replace(/포켓몬/g, '').trim() || pokemon.name;
    const isNameMatched = normalizedSearchKeyword
        ? pokemonNameForSearch.toLowerCase().includes(normalizedSearchKeyword)
        : true;

    return isTypeMatched && isNameMatched;
}

async function getNationalDexScanUpperBound(): Promise<number> {
    if (cachedNationalDexPokemonCount !== null) {
        return cachedNationalDexPokemonCount;
    }

    try {
        const response = await fetch(POKEAPI_ENDPOINTS.pokemonList(1, 0), {
            next: { revalidate: 86400, tags: ['pokemon-list-count'] },
        });

        if (!response.ok) {
            cachedNationalDexPokemonCount = 1025;
            return cachedNationalDexPokemonCount;
        }

        const data = (await response.json()) as PokemonListResponse;
        const count = data.count ?? 1025;
        cachedNationalDexPokemonCount = Math.min(Math.max(1, count), 2000);
        return cachedNationalDexPokemonCount;
    } catch (error) {
        console.error('전국 도감 마릿수 조회 실패, 기본값 사용', error);
        cachedNationalDexPokemonCount = 1025;
        return cachedNationalDexPokemonCount;
    }
}

/** species 1건만 조회해 한국어 이름 추출 (검색 필터용, 상세보다 가벼움) */
async function fetchSpeciesKoreanNameOnly(
    pokemonId: number,
): Promise<string | null> {
    try {
        const response = await fetch(
            POKEAPI_ENDPOINTS.pokemonSpecies(pokemonId),
            {
                next: {
                    revalidate: 86400,
                    tags: [`pokemon-species-name-scan-${pokemonId}`],
                },
            },
        );

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as PokemonSpeciesResponse;
        return (
            data.names?.find((nameEntry) => nameEntry.language.name === 'ko')
                ?.name ?? null
        );
    } catch (error) {
        console.error(
            `species 한글 이름 조회 실패 (id=${pokemonId})`,
            error,
        );
        return null;
    }
}

function isKoreanPokemonNameSearchMatch(
    koreanName: string,
    normalizedSearchKeyword: string,
): boolean {
    const pokemonNameForSearch =
        koreanName.replace(/포켓몬/g, '').trim() || koreanName;

    return pokemonNameForSearch
        .toLowerCase()
        .includes(normalizedSearchKeyword);
}

/**
 * 타입 필터 없이 검색어만 있을 때:
 * 예전에는 raw 목록 페이지마다 종말 종류×2 API로 전국도감 끝까지 돌며 “매칭 20마리”를 채우려 해
 * 희소 검색(예: 고라파덕)에서 극도로 느렸음.
 * species(이름만) 1회/마리로 도감 순 매칭 ID를 모은 뒤, 현재 페이지에 필요한 소수만 상세 조회.
 */
async function fetchFilteredPokemonListPageSearchDexOrder({
    limit,
    offset,
    normalizedSearchKeyword,
}: {
    limit: number;
    offset: number;
    normalizedSearchKeyword: string;
}): Promise<PokemonListPageResult> {
    const sanitizedLimit = Math.max(1, Math.floor(limit));
    const sanitizedOffset = Math.max(0, Math.floor(offset));
    const maxId = await getNationalDexScanUpperBound();

    const matchedPokemonIds: number[] = [];
    const stopAfterMatchCount = sanitizedOffset + sanitizedLimit + 1;
    const batchSize = 50;

    for (
        let batchStart = 1;
        batchStart <= maxId && matchedPokemonIds.length < stopAfterMatchCount;
        batchStart += batchSize
    ) {
        const batchEnd = Math.min(batchStart + batchSize - 1, maxId);
        const batchIds: number[] = [];
        for (let id = batchStart; id <= batchEnd; id++) {
            batchIds.push(id);
        }

        const koreanNamesById = await mapWithConcurrencyLimit(
            batchIds,
            POKEMON_SPECIES_NAME_SCAN_CONCURRENCY,
            async (pokemonId) => {
                const koreanName =
                    await fetchSpeciesKoreanNameOnly(pokemonId);
                return { pokemonId, koreanName };
            },
        );

        for (const row of koreanNamesById) {
            if (
                row.koreanName &&
                isKoreanPokemonNameSearchMatch(
                    row.koreanName,
                    normalizedSearchKeyword,
                )
            ) {
                matchedPokemonIds.push(row.pokemonId);
            }
        }
    }

    const hasMore =
        matchedPokemonIds.length > sanitizedOffset + sanitizedLimit;

    const pageIdSlice = matchedPokemonIds.slice(
        sanitizedOffset,
        sanitizedOffset + sanitizedLimit,
    );

    const pokemonList =
        pageIdSlice.length === 0
            ? []
            : await mapWithConcurrencyLimit(
                  pageIdSlice,
                  POKEMON_LIST_DETAIL_CONCURRENCY,
                  async (pokemonId) =>
                      buildPokemonListItemFromId(
                          pokemonId,
                          `pokemon-${pokemonId}`,
                      ),
              );

    return {
        pokemonList,
        hasMore,
        totalCount: matchedPokemonIds.length,
        nextOffset: sanitizedOffset + sanitizedLimit,
    };
}

/**
 * PokeAPI 타입 리소스에서 해당 타입 포켓몬 ID 목록(도감 번호순, 중복 제거)
 */
async function fetchPokemonEntriesForEnglishTypeSlug(
    englishTypeSlug: string,
): Promise<Array<{ id: number; englishName: string }>> {
    try {
        const response = await fetch(
            POKEAPI_ENDPOINTS.pokemonType(englishTypeSlug),
            {
                next: {
                    revalidate: 86400,
                    tags: [`pokeapi-type-${englishTypeSlug}`],
                },
            },
        );

        if (!response.ok) {
            return [];
        }

        const data = (await response.json()) as PokemonTypeResourceResponse;
        const pokemonById = new Map<number, string>();

        for (const row of data.pokemon ?? []) {
            const parsedId = parsePokemonIdFromUrl(row.pokemon.url);
            if (parsedId === null || pokemonById.has(parsedId)) {
                continue;
            }
            pokemonById.set(parsedId, row.pokemon.name);
        }

        return Array.from(pokemonById.entries())
            .sort((first, second) => first[0] - second[0])
            .map(([id, englishName]) => ({ id, englishName }));
    } catch (error) {
        console.error(
            `타입별 포켓몬 목록(${englishTypeSlug}) 조회 중 에러가 발생했습니다.`,
            error,
        );
        return [];
    }
}

/**
 * ID로 목록용 포켓몬 한 건 조회(한글 이름·대표 타입·썸네일)
 */
async function buildPokemonListItemFromId(
    pokemonId: number,
    fallbackEnglishName: string,
): Promise<PokemonListItem> {
    const detailData = await fetchPokemonListDetail(
        pokemonId,
        fallbackEnglishName,
    );

    return {
        id: pokemonId,
        name: detailData.name,
        typeName: detailData.typeName,
        thumbnailUrl: detailData.thumbnailUrl,
        url: `${POKEAPI_ENDPOINTS.pokemon(pokemonId)}/`,
    };
}

/**
 * 타입이 지정된 필터: 전국 도감을 돌지 않고 /type/{slug} 후보만 상세 조회
 */
async function fetchFilteredPokemonListPageForTypeSlug({
    limit,
    offset,
    selectedTypeName,
    englishTypeSlug,
    normalizedSearchKeyword,
}: {
    limit: number;
    offset: number;
    selectedTypeName: string;
    englishTypeSlug: string;
    normalizedSearchKeyword: string;
}): Promise<PokemonListPageResult> {
    const sanitizedLimit = Math.max(1, Math.floor(limit));
    const sanitizedOffset = Math.max(0, Math.floor(offset));
    const typeEntries =
        await fetchPokemonEntriesForEnglishTypeSlug(englishTypeSlug);

    if (typeEntries.length === 0) {
        return {
            pokemonList: [],
            hasMore: false,
            totalCount: 0,
            nextOffset: sanitizedOffset + sanitizedLimit,
        };
    }

    const localizedPokemonList = await mapWithConcurrencyLimit(
        typeEntries,
        POKEMON_TYPE_FILTER_DETAIL_CONCURRENCY,
        async ({ id, englishName }) =>
            buildPokemonListItemFromId(id, englishName),
    );

    const matchedPokemonList = localizedPokemonList.filter((pokemon) =>
        isMatchedPokemon({
            pokemon,
            selectedTypeName,
            normalizedSearchKeyword,
        }),
    );

    const pagedMatchedPokemonList = matchedPokemonList.slice(
        sanitizedOffset,
        sanitizedOffset + sanitizedLimit,
    );

    return {
        pokemonList: pagedMatchedPokemonList,
        hasMore: matchedPokemonList.length > sanitizedOffset + sanitizedLimit,
        totalCount: matchedPokemonList.length,
        nextOffset: sanitizedOffset + sanitizedLimit,
    };
}

interface FetchFilteredPokemonListPageOptions {
    limit: number;
    offset: number;
    selectedTypeName: string | null;
    /** 알려진 영문 타입 슬러그(water 등). 있으면 타입 API 우선 경로 */
    englishTypeSlug: string | null;
    normalizedSearchKeyword: string;
}

async function fetchFilteredPokemonListPage({
    limit,
    offset,
    selectedTypeName,
    englishTypeSlug,
    normalizedSearchKeyword,
}: FetchFilteredPokemonListPageOptions): Promise<PokemonListPageResult> {
    if (englishTypeSlug && selectedTypeName) {
        return fetchFilteredPokemonListPageForTypeSlug({
            limit,
            offset,
            selectedTypeName,
            englishTypeSlug,
            normalizedSearchKeyword,
        });
    }

    // 타입 전체 + 검색어: raw 연속 페이지 방식은 희소 매칭에서 전국도감 전체를 뒤져 매우 느림
    if (normalizedSearchKeyword && !englishTypeSlug) {
        return fetchFilteredPokemonListPageSearchDexOrder({
            limit,
            offset,
            normalizedSearchKeyword,
        });
    }

    const sanitizedLimit = Math.max(1, Math.floor(limit));
    const sanitizedOffset = Math.max(0, Math.floor(offset));
    const requiredMatchedCount = sanitizedOffset + sanitizedLimit;
    const matchedPokemonList: PokemonListItem[] = [];
    let sourceOffset = 0;
    let sourceHasMore = true;

    // 타입 미지정(검색어만 등): 기존처럼 전국 도감 페이지를 순회
    while (sourceHasMore && matchedPokemonList.length < requiredMatchedCount) {
        const rawPageResult = await fetchRawPokemonListPage({
            limit: 40,
            offset: sourceOffset,
        });

        const matchedInCurrentPage = rawPageResult.pokemonList.filter(
            (pokemon) =>
                isMatchedPokemon({
                    pokemon,
                    selectedTypeName,
                    normalizedSearchKeyword,
                }),
        );

        matchedPokemonList.push(...matchedInCurrentPage);
        sourceOffset = rawPageResult.nextOffset;
        sourceHasMore = rawPageResult.hasMore;
    }

    const pagedMatchedPokemonList = matchedPokemonList.slice(
        sanitizedOffset,
        sanitizedOffset + sanitizedLimit,
    );

    return {
        pokemonList: pagedMatchedPokemonList,
        hasMore:
            matchedPokemonList.length > sanitizedOffset + sanitizedLimit ||
            sourceHasMore,
        totalCount: matchedPokemonList.length,
        nextOffset: sanitizedOffset + sanitizedLimit,
    };
}

async function fetchRawPokemonListPage({
    limit,
    offset,
}: {
    limit: number;
    offset: number;
}): Promise<PokemonListPageResult> {
    try {
        const sanitizedLimit = Math.max(1, Math.floor(limit));
        const sanitizedOffset = Math.max(0, Math.floor(offset));
        const response = await fetch(
            POKEAPI_ENDPOINTS.pokemonList(sanitizedLimit, sanitizedOffset),
            {
                next: { revalidate: 300, tags: ['pokemon-list'] },
            },
        );

        if (!response.ok) {
            throw new Error(`포켓몬 목록 요청 실패: ${response.status}`);
        }

        const data = (await response.json()) as PokemonListResponse;

        const pokemonList = (data.results ?? [])
            .map(mapPokemonListItem)
            .filter((item): item is PokemonListItem => item !== null);

        const localizedPokemonList = await mapWithConcurrencyLimit(
            pokemonList,
            POKEMON_LIST_DETAIL_CONCURRENCY,
            async (pokemon) => {
                const pokemonDetailData = await fetchPokemonListDetail(
                    pokemon.id,
                    pokemon.name,
                );

                return {
                    ...pokemon,
                    ...pokemonDetailData,
                };
            },
        );

        return {
            pokemonList: localizedPokemonList,
            hasMore: Boolean(data.next),
            totalCount: data.count ?? 0,
            nextOffset: sanitizedOffset + sanitizedLimit,
        };
    } catch (error) {
        console.error('포켓몬 목록을 불러오는 중 에러가 발생했습니다.', error);
        return {
            pokemonList: [],
            hasMore: false,
            totalCount: 0,
            nextOffset: offset,
        };
    }
}

const STAT_NAME_MAP: Record<string, string> = {
    hp: 'HP',
    attack: '공격',
    defense: '방어',
    'special-attack': '특수공격',
    'special-defense': '특수방어',
    speed: '스피드',
};

/**
 * 포켓몬 상세 정보 조회 (모달/상세 페이지용)
 * @param pokemonId 포켓몬 ID
 * @returns 한글화된 포켓몬 상세 정보
 */
export async function fetchPokemonDetail(
    pokemonId: number,
): Promise<PokemonDetail | null> {
    try {
        const [pokemonResponse, speciesResponse] = await Promise.all([
            fetch(POKEAPI_ENDPOINTS.pokemon(pokemonId), {
                next: {
                    revalidate: 86400,
                    tags: [`pokemon-detail-${pokemonId}`],
                },
            }),
            fetch(POKEAPI_ENDPOINTS.pokemonSpecies(pokemonId), {
                next: {
                    revalidate: 86400,
                    tags: [`pokemon-species-detail-${pokemonId}`],
                },
            }),
        ]);

        if (!pokemonResponse.ok || !speciesResponse.ok) {
            return null;
        }

        const pokemonData =
            (await pokemonResponse.json()) as PokemonFullResponse;
        const speciesData =
            (await speciesResponse.json()) as PokemonSpeciesFullResponse;

        const koreanName =
            speciesData.names?.find((n) => n.language.name === 'ko')?.name ??
            `포켓몬 #${pokemonId}`;

        const englishName =
            speciesData.names?.find((n) => n.language.name === 'en')?.name ??
            `Pokemon #${pokemonId}`;

        const genus =
            speciesData.genera?.find((g) => g.language.name === 'ko')?.genus ??
            '';

        // 한국어 도감 설명 (가장 최신 버전 우선)
        const koreanFlavorTexts =
            speciesData.flavor_text_entries?.filter(
                (entry) => entry.language.name === 'ko',
            ) ?? [];
        const description = koreanFlavorTexts.length > 0
            ? koreanFlavorTexts[koreanFlavorTexts.length - 1].flavor_text
                  .replace(/\f/g, ' ')
                  .replace(/\n/g, ' ')
            : '';

        const types = (pokemonData.types ?? [])
            .slice()
            .sort((a, b) => a.slot - b.slot)
            .map((t) => getKoreanPokemonTypeName(t.type.name));

        const stats = (pokemonData.stats ?? []).map((s) => ({
            name: STAT_NAME_MAP[s.stat.name] ?? s.stat.name,
            value: s.base_stat,
        }));

        const abilities = (pokemonData.abilities ?? []).map((a) =>
            a.is_hidden ? `${a.ability.name} (숨겨진 특성)` : a.ability.name,
        );

        return {
            id: pokemonId,
            koreanName,
            englishName,
            genus,
            description,
            imageUrl: buildPokemonThumbnailUrl(pokemonId),
            types,
            height: pokemonData.height,
            weight: pokemonData.weight,
            stats,
            abilities,
        };
    } catch (error) {
        console.error(
            `포켓몬 상세 정보(${pokemonId}) 조회 중 에러가 발생했습니다.`,
            error,
        );
        return null;
    }
}
