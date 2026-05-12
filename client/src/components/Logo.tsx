import { SVGProps } from "react";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 120 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <defs>
                {/* Male gradient: cool blue */}
                <linearGradient id="maleGrad" x1="10" y1="5" x2="60" y2="88" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa" />
                    <stop offset="0.5" stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
                {/* Female gradient: warm pink */}
                <linearGradient id="femaleGrad" x1="60" y1="5" x2="110" y2="88" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f472b6" />
                    <stop offset="0.5" stopColor="#ec4899" />
                    <stop offset="1" stopColor="#db2777" />
                </linearGradient>
                {/* Heart gradient: blend of both */}
                <linearGradient id="heartGrad" x1="48" y1="68" x2="72" y2="86" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa" />
                    <stop offset="0.3" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Male side profile (left, facing RIGHT) */}
            <path
                d="M 10 88
                   L 10 74
                   C 10 68 14 64 20 62
                   L 28 59
                   C 24 56 22 52 22 47
                   L 22 45
                   C 22 44 22 43 22 42
                   L 22 40
                   C 20 38 19 35 19 32
                   C 19 28 21 24 24 22
                   C 24 18 24 14 26 12
                   C 29 7 34 5 40 5
                   C 46 5 50 8 50 14
                   C 50 16 49 18 48 20
                   L 48 22
                   C 50 24 51 27 51 30
                   L 51 32
                   C 52 34 52 35 53 36
                   L 55 38
                   C 56 39 56 40 56 41
                   L 56 42
                   L 54 44
                   L 53 46
                   L 56 48
                   C 57 49 57 50 56 51
                   L 53 54
                   C 51 56 50 58 50 60
                   L 55 62
                   C 58 64 60 68 60 72
                   L 60 88
                   Z"
                fill="url(#maleGrad)"
                opacity="0.95"
            />

            {/* Female side profile (right, facing LEFT) — mirrored */}
            <path
                d="M 110 88
                   L 110 74
                   C 110 68 106 64 100 62
                   L 92 59
                   C 96 56 98 52 98 47
                   L 98 45
                   C 98 44 98 43 98 42
                   L 98 40
                   C 100 38 101 35 101 32
                   C 101 28 99 24 96 22
                   C 96 18 96 14 94 12
                   C 91 7 86 5 80 5
                   C 74 5 70 8 70 14
                   C 70 16 71 18 72 20
                   L 72 22
                   C 70 24 69 27 69 30
                   L 69 32
                   C 68 34 68 35 67 36
                   L 65 38
                   C 64 39 64 40 64 41
                   L 64 42
                   L 66 44
                   L 67 46
                   L 64 48
                   C 63 49 63 50 64 51
                   L 67 54
                   C 69 56 70 58 70 60
                   L 65 62
                   C 62 64 60 68 60 72
                   L 60 88
                   Z"
                fill="url(#femaleGrad)"
                opacity="0.95"
            />

            {/* Small heart between the faces */}
            <path
                d="M 60 76
                   C 60 74 58 72 56 72
                   C 54 72 52 74 52 76
                   C 52 80 56 83 60 86
                   C 64 83 68 80 68 76
                   C 68 74 66 72 64 72
                   C 62 72 60 74 60 76 Z"
                fill="url(#heartGrad)"
                opacity="0.7"
                filter="url(#glow)"
            />
        </svg>
    );
}
