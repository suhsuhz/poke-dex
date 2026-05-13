import PokemonFullPageSearchLock from './PokemonFullPageSearchLock';

export default function PokemonDetailSegmentLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <PokemonFullPageSearchLock>{children}</PokemonFullPageSearchLock>;
}
