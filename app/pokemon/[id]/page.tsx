import PokemonDetailContent from '@/components/features/pokemon/PokemonDetailContent';
import {
    loadPokemonDetailFromParams,
    type PokemonDetailRouteParams,
} from '@/lib/pokemon/loadPokemonDetailFromParams';
import Link from 'next/link';

type PokemonDetailPageProps = {
    params: PokemonDetailRouteParams;
};

export default async function PokemonDetailPage({
    params,
}: PokemonDetailPageProps) {
    const pokemon = await loadPokemonDetailFromParams(params);

    return (
        <main className='mx-auto w-full max-w-3xl px-4 py-8'>
            <Link
                href='/'
                className='mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800'
            >
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <polyline points='15 18 9 12 15 6' />
                </svg>
                목록으로 돌아가기
            </Link>
            <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
                <PokemonDetailContent pokemon={pokemon} />
            </div>
        </main>
    );
}
