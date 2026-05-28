import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      brand: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
      },
    },
  },
  shortcuts: {
    'card': 'bg-white rounded-2xl shadow-sm border border-gray-100/80',
    'card-hover': 'bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow duration-300',
    'page-container': 'p-6 min-h-full',
    'page-title': 'text-xl font-semibold text-gray-800 mb-1',
    'page-desc': 'text-sm text-gray-400 mb-6',
    'btn-gradient': 'bg-gradient-to-r from-brand-500 to-brand-400 text-white border-none',
  },
})
