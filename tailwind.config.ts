import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Continental Brand Colors
				continental: {
					yellow: '#ffa500',
					black: '#000000',
					white: '#ffffff',
					silver: '#cdcdcd',
					gray1: '#737373',
					gray2: '#969696',
					gray3: '#cdcdcd',
					gray4: '#f0f0f0',
					'light-blue': '#00a5dc',
					'dark-blue': '#004eaf',
					'light-green': '#2db928',
					'dark-green': '#057855',
					'light-red': '#ff2d37'
				},
				// AUMOVIO brand color aliases referencing CSS variables (HSL)
				aum: {
					orange: 'hsl(var(--aum-orange))',
					'orange-500': 'hsl(var(--aum-orange-500))',
					'orange-300': 'hsl(var(--aum-orange-300))',
					'orange-200': 'hsl(var(--aum-orange-200))',
					'orange-100': 'hsl(var(--aum-orange-100))',
					purple: 'hsl(var(--aum-purple))',
					'purple-500': 'hsl(var(--aum-purple-500))',
					'purple-300': 'hsl(var(--aum-purple-300))',
					'purple-200': 'hsl(var(--aum-purple-200))',
					'purple-100': 'hsl(var(--aum-purple-100))',
					spark: 'hsl(var(--spark))',
					'gray-500': 'hsl(var(--gray-500))',
					'gray-400': 'hsl(var(--gray-400))',
					'gray-300': 'hsl(var(--gray-300))',
					'gray-200': 'hsl(var(--gray-200))',
					'gray-100': 'hsl(var(--gray-100))'
				}
			},
			fontFamily: {
				continental: ['Aumovio Screen', 'Inter', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
