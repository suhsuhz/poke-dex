import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import { RouteSearchAvailabilityProvider } from '@/components/providers/RouteSearchAvailabilityProvider';
import { Suspense } from 'react';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: '포켓몬 도감 with Cursor',
    description: '포켓몬 도감 with Cursor',
};

export default function RootLayout({
    children,
    modal,
}: Readonly<{
    children: React.ReactNode;
    modal: React.ReactNode;
}>) {
    return (
        <html
            lang='en'
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className='min-h-full flex flex-col w-full mx-auto pt-8 pb-12 lg:pt-14 lg:pb-16'>
                <RouteSearchAvailabilityProvider>
                    <Suspense>
                        <Header />
                    </Suspense>
                    {children}
                    {modal}
                </RouteSearchAvailabilityProvider>
            </body>
        </html>
    );
}
