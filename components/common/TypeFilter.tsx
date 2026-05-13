import { POKEMON_TYPE_NAME_MAP } from '@/constants/pokemon-types';

interface TypeFilterProps {
    selectedType: string;
    onTypeChange: (nextType: string) => void;
}

export default function TypeFilter({
    selectedType,
    onTypeChange,
}: TypeFilterProps) {
    return (
        <div className='relative w-full shrink-0 sm:w-auto'>
            <label htmlFor='pokemon-type-filter' className='sr-only'>
                포켓몬 타입 필터
            </label>
            <select
                id='pokemon-type-filter'
                value={selectedType}
                onChange={(event) => onTypeChange(event.target.value)}
                className='pokemon-type-select w-full sm:w-auto'
            >
                <option value='all'>전체</option>
                {Object.entries(POKEMON_TYPE_NAME_MAP).map(
                    ([typeSlug, typeLabel]) => (
                        <option key={typeSlug} value={typeSlug}>
                            {typeLabel}
                        </option>
                    ),
                )}
            </select>
            <span className='pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sm text-slate-500'>
                ▾
            </span>
        </div>
    );
}
