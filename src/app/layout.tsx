import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Flownaŭ",
    description: "Unified media automation platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-black text-white`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
