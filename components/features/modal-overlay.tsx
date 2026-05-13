'use client';

import { useRouter } from 'next/navigation';
import {
    useEffect,
    useCallback,
    type ReactNode,
    type MouseEvent,
    type PointerEvent,
} from 'react';

type ModalOverlayProps = {
    children: ReactNode;
};

export default function ModalOverlay({ children }: ModalOverlayProps) {
    const router = useRouter();

    // X·배경·ESC 닫기 = 브라우저 뒤로가기와 동일(히스토리 한 단계 pop). 연속 모달은 PokemonList Link replace로 스택이 안 쌓이게 함
    const handleClose = useCallback(() => {
        router.back();
    }, [router]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                handleClose();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        // 모달이 열리면 배경 스크롤 방지
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleClose]);

    // 배경에서 기본 동작을 막아 같은 제스처로 뒤 콘텐츠가 눌리는 것을 방지 (클릭 관통 완화)
    function handleBackdropPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) {
            event.preventDefault();
        }
    }

    // 배경(오버레이) 클릭 시 닫기 — 내부 콘텐츠 클릭은 무시
    function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
        if (event.target === event.currentTarget) {
            handleClose();
        }
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]'
            role='dialog'
            aria-modal='true'
            onPointerDown={handleBackdropPointerDown}
            onClick={handleBackdropClick}
        >
            {/* 패널 전체 onClick stopPropagation은 자식 X 버튼 클릭과 충돌할 수 있어 제거 — 포인터는 배경으로만 새지 않게 처리 */}
            <div
                className='relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl'
                onPointerDown={(event) => event.stopPropagation()}
            >
                {children}
                {/* DOM 순서상 맨 위에 두고 z-index로 겹침 — 콘텐츠(Image 등)가 X 위를 덮는 경우 대비 */}
                <button
                    type='button'
                    className='pointer-events-auto absolute right-3 top-3 z-100 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800'
                    onClick={handleClose}
                    aria-label='모달 닫기'
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden
                    >
                        <line x1='18' y1='6' x2='6' y2='18' />
                        <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                </button>
            </div>
        </div>
    );
}
