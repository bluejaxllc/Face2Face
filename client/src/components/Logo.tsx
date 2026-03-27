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
                fill="var(--primary, hsl(222, 60%, 45%))"
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
                fill="var(--secondary, hsl(330, 81%, 60%))"
                opacity="0.95"
            />

            {/* Gradient defs */}
            <defs>
                <linearGradient id="faceGrad" x1="10" y1="5" x2="110" y2="88" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary, hsl(222, 60%, 45%))" />
                    <stop offset="1" stopColor="var(--secondary, hsl(330, 81%, 60%))" />
                </linearGradient>
            </defs>
        </svg>
    );
}
