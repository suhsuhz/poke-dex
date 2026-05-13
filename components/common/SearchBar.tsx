interface SearchBarProps {
    searchKeyword: string;
    onSearchKeywordChange: (nextKeyword: string) => void;
}

export default function SearchBar({
    searchKeyword,
    onSearchKeywordChange,
}: SearchBarProps) {
    return (
        <div className='relative w-full'>
            <label htmlFor='pokemon-search' className='sr-only'>
                포켓몬 검색
            </label>
            <input
                id='pokemon-search'
                type='search'
                placeholder='포켓몬 이름을 검색해보세요'
                value={searchKeyword}
                onChange={(event) => onSearchKeywordChange(event.target.value)}
                className='w-full rounded-full border border-slate-300 bg-white py-2 pl-4 pr-20 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            />
            <button type='submit' className='poke-go-badge' aria-label='검색'>
                Go
            </button>
        </div>
    );
}
