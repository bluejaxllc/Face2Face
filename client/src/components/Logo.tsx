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
            {/* Male profile silhouette (left, facing right) */}
            <path
                d="M 8 90
                   L 8 72
                   C 8 65 12 60 18 58
                   L 25 55
                   C 22 52 20 48 20 44
                   L 20 42
                   C 19 40 18 37 18 34
                   C 18 30 19 27 21 25
                   C 21 24 21 23 21 22
                   C 21 14 27 8 35 8
                   C 43 8 49 14 49 22
                   C 49 23 49 24 48 25
                   C 49 26 50 27 50 28
                   L 52 32
                   C 53 34 53 36 52 38
                   L 50 42
                   C 50 43 50 44 50 44
                   C 50 48 48 52 45 55
                   L 52 58
                   C 56 60 58 63 58 68
                   L 58 90
                   Z"
                fill="var(--primary, hsl(222, 60%, 45%))"
                opacity="0.95"
            />

            {/* Female profile silhouette (right, facing left) - mirrored */}
            <path
                d="M 112 90
                   L 112 72
                   C 112 65 108 60 102 58
                   L 95 55
                   C 98 52 100 48 100 44
                   L 100 42
                   C 101 40 102 37 102 34
                   C 102 30 101 27 99 25
                   C 99 24 99 23 99 22
                   C 99 14 93 8 85 8
                   C 77 8 71 14 71 22
                   C 71 23 71 24 72 25
                   C 71 26 70 27 70 28
                   L 68 32
                   C 67 34 67 36 68 38
                   L 70 42
                   C 70 43 70 44 70 44
                   C 70 48 72 52 75 55
                   L 68 58
                   C 64 60 62 63 62 68
                   L 62 90
                   Z"
                fill="var(--secondary, hsl(330, 81%, 60%))"
                opacity="0.95"
            />

            {/* Subtle heart/spark between the two faces */}
            <path
                d="M 60 42
                   C 57 38 53 38 53 42
                   C 53 46 60 52 60 52
                   C 60 52 67 46 67 42
                   C 67 38 63 38 60 42
                   Z"
                fill="url(#heartGradient)"
                opacity="0.7"
            />

            {/* Gradient definitions */}
            <defs>
                <linearGradient id="heartGradient" x1="53" y1="38" x2="67" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary, hsl(222, 60%, 45%))" />
                    <stop offset="1" stopColor="var(--secondary, hsl(330, 81%, 60%))" />
                </linearGradient>
            </defs>
        </svg>
    );
}
