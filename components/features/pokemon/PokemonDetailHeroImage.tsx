'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

type PokemonDetailHeroImageProps = {
    imageUrl: string;
    koreanName: string;
    priority?: boolean;
};

// 잘림(clipping)은 PokemonDetailContent 좌측 그라데이션 컬럼(overflow-hidden) 기준
const SCALE = 1.08;
const MAX_SHIFT_PX = 16;
const MAX_ROTATE_DEG = 7;
/** 손 뗌/마우스 나감 시 원위치 복귀 시간(ms) */
const RELEASE_DURATION_MS = 220;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export default function PokemonDetailHeroImage({
    imageUrl,
    koreanName,
    priority = false,
}: PokemonDetailHeroImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [normalized, setNormalized] = useState({ nx: 0, ny: 0 });
    /** true일 때만 복귀용 transition 적용 — 추적 중에는 transition 없음(지연 없음) */
    const [isReleasing, setIsReleasing] = useState(false);

    const updateFromClient = useCallback((clientX: number, clientY: number) => {
        const el = containerRef.current;
        if (!el) {
            return;
        }

        const rect = el.getBoundingClientRect();
        const halfWidth = rect.width / 2 || 1;
        const halfHeight = rect.height / 2 || 1;
        const nx = clamp(
            (clientX - rect.left - halfWidth) / halfWidth,
            -1,
            1,
        );
        const ny = clamp(
            (clientY - rect.top - halfHeight) / halfHeight,
            -1,
            1,
        );

        setIsReleasing(false);
        setNormalized({ nx, ny });
    }, []);

    const handleReset = useCallback(() => {
        setIsReleasing(true);
        setNormalized({ nx: 0, ny: 0 });
    }, []);

    const { nx, ny } = normalized;
    const transformStyle = {
        transform: `translate(${nx * MAX_SHIFT_PX}px, ${ny * MAX_SHIFT_PX}px) rotate(${nx * -MAX_ROTATE_DEG}deg) scale(${SCALE})`,
        transition: isReleasing
            ? `transform ${RELEASE_DURATION_MS}ms cubic-bezier(0.25, 0.8, 0.25, 1)`
            : 'none',
    };

    return (
        <div
            ref={containerRef}
            className='relative aspect-square w-full max-w-[280px] select-none touch-none'
            onMouseEnter={() => setIsReleasing(false)}
            onMouseMove={(event) => {
                updateFromClient(event.clientX, event.clientY);
            }}
            onMouseLeave={handleReset}
            onTouchStart={(event) => {
                const touch = event.touches[0];
                if (touch) {
                    updateFromClient(touch.clientX, touch.clientY);
                }
            }}
            onTouchMove={(event) => {
                const touch = event.touches[0];
                if (touch) {
                    updateFromClient(touch.clientX, touch.clientY);
                }
            }}
            onTouchEnd={handleReset}
            onTouchCancel={handleReset}
        >
            {/* 움직이는 레이어 — 영역 밖 잘림은 상위 그라데이션 컬럼 overflow-hidden */}
            <div
                className='absolute inset-0 flex items-center justify-center will-change-transform'
                style={transformStyle}
            >
                <div className='relative h-full w-full'>
                    <Image
                        src={imageUrl}
                        alt={koreanName}
                        fill
                        sizes='280px'
                        className='object-contain drop-shadow-lg'
                        priority={priority}
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
}
