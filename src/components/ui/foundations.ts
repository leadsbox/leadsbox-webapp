/**
 * Centralised UI design tokens shared across components.
 * Use these when creating new primitives so styling stays consistent.
 */

export const radii = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
} as const

export const spacing = {
  xs: "var(--space-1)",
  sm: "var(--space-2)",
  md: "var(--space-3)",
  lg: "var(--space-4)",
  xl: "var(--space-5)",
  "2xl": "var(--space-6)",
  "3xl": "var(--space-7)",
  "4xl": "var(--space-8)",
} as const

export const durations = {
  fast: "var(--duration-fast)",
  base: "var(--duration-base)",
  slow: "var(--duration-slow)",
} as const

export const easings = {
  standard: "var(--ease-standard)",
} as const

export const shadows = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  brand: "var(--shadow-brand)",
} as const

export const interactionTokens = {
  focusRing: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
  transition:
    "transition-[background-color,color,border-color,box-shadow,transform] duration-base ease-standard motion-reduce:transition-none",
  transitionFast:
    "transition-[background-color,color,border-color,box-shadow,transform] duration-fast ease-standard motion-reduce:transition-none",
} as const

export const stateClasses = {
  pressed: "active:translate-y-px",
  disabled:
    "disabled:cursor-not-allowed disabled:opacity-60 [data-disabled=true]:cursor-not-allowed [data-disabled=true]:opacity-60",
  loading:
    "data-[state=loading]:pointer-events-none data-[state=loading]:opacity-75 data-[state=loading]:cursor-progress",
} as const

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function motionClassName(prefersMotionFallback = "") {
  return prefersReducedMotion() ? prefersMotionFallback : interactionTokens.transition
}
