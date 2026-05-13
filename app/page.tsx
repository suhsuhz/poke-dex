import PokeList from '@/components/features/pokemon/PokemonList';
import PokeSkeleton from '@/components/features/pokemon/PokemonSkeleton';
import { Suspense } from 'react';

interface HomePageProps {
    searchParams?: Promise<{
        type?: string | string[];
        q?: string | string[];
    }>;
}

export default async function Home({ searchParams }: HomePageProps) {
    const resolvedSearchParams = await searchParams;
    const selectedTypeRaw = resolvedSearchParams?.type;
    const searchKeywordRaw = resolvedSearchParams?.q;
    const selectedType = Array.isArray(selectedTypeRaw)
        ? (selectedTypeRaw[0] ?? 'all')
        : (selectedTypeRaw ?? 'all');
    const searchKeyword = Array.isArray(searchKeywordRaw)
        ? (searchKeywordRaw[0] ?? '')
        : (searchKeywordRaw ?? '');

    return (
        <div>
            <main className='mx-auto w-full max-w-screen-2xl px-4 sm:px-8 lg:px-14 xl:px-20'>
                <Suspense fallback={<PokeSkeleton />}>
                    <PokeList
                        selectedType={selectedType}
                        searchKeyword={searchKeyword}
                    />
                </Suspense>
            </main>
        </div>
    );
}
