import ModalOverlay from '@/components/features/modal-overlay';
import PokemonDetailContent from '@/components/features/pokemon/PokemonDetailContent';
import {
    loadPokemonDetailFromParams,
    type PokemonDetailRouteParams,
} from '@/lib/pokemon/loadPokemonDetailFromParams';

type PokemonModalPageProps = {
    params: PokemonDetailRouteParams;
};

export default async function PokemonModalPage({
    params,
}: PokemonModalPageProps) {
    const pokemon = await loadPokemonDetailFromParams(params);

    return (
        <ModalOverlay>
            <PokemonDetailContent pokemon={pokemon} />
        </ModalOverlay>
    );
}
