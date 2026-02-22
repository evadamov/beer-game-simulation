/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bgStart: '#0f172a',
                bgEnd: '#1e293b',
                panelBg: 'rgba(30, 41, 59, 0.7)',
                panelBorder: 'rgba(255, 255, 255, 0.1)',
                brandPrimary: '#3b82f6',
                brandSecondary: '#8b5cf6',
                accentSuccess: '#10b981',
                accentWarning: '#f59e0b',
                accentDanger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
