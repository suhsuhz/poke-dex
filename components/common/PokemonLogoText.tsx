interface PokemonLogoTextProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const logoSizeClassMap = {
    sm: 'pokemon-logo-text--sm',
    md: 'pokemon-logo-text--md',
    lg: 'pokemon-logo-text--lg',
} as const;

export default function PokemonLogoText({
    size = 'md',
    text = 'Pokemon',
    className = '',
}: PokemonLogoTextProps) {
    return (
        <p
            className={`pokemon-logo-text ${logoSizeClassMap[size]} select-none ${className}`.trim()}
        >
            {text}
        </p>
    );
}
