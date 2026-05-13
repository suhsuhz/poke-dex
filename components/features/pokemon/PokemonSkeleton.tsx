export default function PokeSkeleton() {
    return (
        <section aria-label='포켓몬 목록 로딩'>
            <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, index) => (
                    <li
                        key={`pokemon-skeleton-${index}`}
                        className='h-12 animate-pulse rounded-md border bg-gray-100'
                    />
                ))}
            </ul>
        </section>
    );
}
