import type { PokemonDetail } from '@/types/pokemon';
import PokemonDetailHeroImage from '@/components/features/pokemon/PokemonDetailHeroImage';

type PokemonDetailContentProps = {
    pokemon: PokemonDetail;
};

function StatBar({ value, max = 255 }: { value: number; max?: number }) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div className='h-2.5 w-full rounded-full bg-gray-200'>
            <div
                className='h-2.5 rounded-full bg-blue-500 transition-all'
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

export default function PokemonDetailContent({
    pokemon,
}: PokemonDetailContentProps) {
    // 키: 데시미터 → 미터, 몸무게: 헥토그램 → 킬로그램
    const heightInMeters = (pokemon.height / 10).toFixed(1);
    const weightInKg = (pokemon.weight / 10).toFixed(1);

    return (
        <div className='flex flex-col md:flex-row gap-0'>
            {/* 좌측: 포켓몬 이미지 — overflow-hidden으로 히어로 움직임이 이 박스 밖으로 안 나가게 클립 */}
            <div className='flex items-center justify-center overflow-hidden bg-linear-to-b from-blue-50 to-slate-100 p-6 md:w-2/5 md:rounded-l-2xl'>
                <PokemonDetailHeroImage
                    imageUrl={pokemon.imageUrl}
                    koreanName={pokemon.koreanName}
                    priority
                />
            </div>

            {/* 우측: 한글 정보 */}
            <div className='flex-1 space-y-4 p-6'>
                {/* 이름 + 번호 */}
                <div>
                    <p className='text-sm text-gray-400'>
                        No.{String(pokemon.id).padStart(4, '0')}
                    </p>
                    <h2 className='text-2xl font-bold text-gray-900'>
                        {pokemon.koreanName}
                    </h2>
                    <p className='text-sm text-gray-500'>
                        {pokemon.englishName}
                    </p>
                    {pokemon.genus && (
                        <p className='mt-1 text-sm text-gray-600'>
                            {pokemon.genus}
                        </p>
                    )}
                </div>

                {/* 타입 */}
                <div>
                    <h3 className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                        타입
                    </h3>
                    <div className='flex gap-2'>
                        {pokemon.types.map((type) => (
                            <span
                                key={type}
                                className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800'
                            >
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 도감 설명 */}
                {pokemon.description && (
                    <div>
                        <h3 className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                            도감 설명
                        </h3>
                        <p className='text-sm leading-relaxed text-gray-700'>
                            {pokemon.description}
                        </p>
                    </div>
                )}

                {/* 신체 정보 */}
                <div className='flex gap-6'>
                    <div>
                        <h3 className='mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                            키
                        </h3>
                        <p className='text-sm font-medium text-gray-800'>
                            {heightInMeters}m
                        </p>
                    </div>
                    <div>
                        <h3 className='mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                            몸무게
                        </h3>
                        <p className='text-sm font-medium text-gray-800'>
                            {weightInKg}kg
                        </p>
                    </div>
                </div>

                {/* 특성 */}
                {pokemon.abilities.length > 0 && (
                    <div>
                        <h3 className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                            특성
                        </h3>
                        <div className='flex flex-wrap gap-2'>
                            {pokemon.abilities.map((ability) => (
                                <span
                                    key={ability}
                                    className='rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-700'
                                >
                                    {ability}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 능력치 */}
                {pokemon.stats.length > 0 && (
                    <div>
                        <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400'>
                            능력치
                        </h3>
                        <div className='space-y-2'>
                            {pokemon.stats.map((stat) => (
                                <div
                                    key={stat.name}
                                    className='flex items-center gap-3'
                                >
                                    <span className='w-16 shrink-0 text-right text-xs font-medium text-gray-500'>
                                        {stat.name}
                                    </span>
                                    <span className='w-8 text-xs font-bold text-gray-800'>
                                        {stat.value}
                                    </span>
                                    <div className='flex-1'>
                                        <StatBar value={stat.value} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
