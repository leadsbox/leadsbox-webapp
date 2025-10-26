import * as React from "react"
import { createPortal } from "react-dom"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { interactionTokens, stateClasses } from "./foundations"

const baseButtonClass = cn(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em]",
  "rounded-[var(--radius-sm)] px-4 py-2 text-sm ring-offset-background",
  interactionTokens.transitionFast,
  stateClasses.pressed,
  stateClasses.disabled,
  stateClasses.loading,
  "focus-visible:outline-none focus-visible:shadow-focus [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
)

const buttonVariants = cva(baseButtonClass, {
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow-sm hover:bg-[hsl(var(--primary-hover))]",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground",
      secondary:
        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost:
        "text-foreground hover:bg-muted/60",
      subtle:
        "bg-muted/80 text-foreground shadow-sm hover:bg-muted",
      link:
        "bg-transparent px-0 text-primary underline-offset-4 shadow-none hover:text-primary/90 hover:underline",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-base",
      xl: "h-12 px-6 text-base",
      icon: "size-10 p-0 [&_svg]:size-5",
      default: "h-10 px-4 text-sm",
    },
    align: {
      start: "justify-start",
      center: "justify-center",
    },
  },
  compoundVariants: [
    {
      size: "icon",
      class: "rounded-[var(--radius-sm)]",
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
    align: "center",
  },
})

type ButtonNativeProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export interface ButtonProps
  extends Omit<ButtonNativeProps, "disabled">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  loading?: boolean
  disabled?: boolean
  spinnerLabel?: string
}

type ButtonRef = HTMLButtonElement | HTMLAnchorElement

const Button = React.forwardRef<ButtonRef, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      align,
      asChild = false,
      leadingIcon,
      trailingIcon,
      loading = false,
      spinnerLabel = "Processing",
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const spinnerOverlay = useGlobalSpinnerOverlay(loading, spinnerLabel)

    const renderInner = (content: React.ReactNode) => (
      <span className="relative flex w-full items-center justify-center">
        {loading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-current">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            <span className="sr-only">{spinnerLabel}</span>
          </span>
        ) : null}
        <span
          className={cn(
            "pointer-events-none flex w-full items-center justify-center gap-2",
            loading && "opacity-0"
          )}
        >
          {leadingIcon ? (
            <span aria-hidden className="inline-flex items-center justify-center">
              {leadingIcon}
            </span>
          ) : null}
          {content}
          {trailingIcon ? (
            <span aria-hidden className="inline-flex items-center justify-center">
              {trailingIcon}
            </span>
          ) : null}
        </span>
      </span>
    )

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>
      const mergedClassName = cn(child.props.className, buttonVariants({ variant, size, align, className }))

      const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isDisabled) {
          event.preventDefault()
          return
        }
        child.props?.onClick?.(event)
        onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
      }

      return (
        <>
          {spinnerOverlay}
          {React.cloneElement(child, {
            className: mergedClassName,
            ref: ref as React.Ref<any>,
            "data-state": loading ? "loading" : undefined,
            "data-disabled": isDisabled || undefined,
            "aria-disabled": isDisabled || undefined,
            "aria-busy": loading || undefined,
            children: renderInner(child.props.children),
            onClick: handleClick,
            ...props,
          })}
        </>
      )
    }

    return (
      <>
        {spinnerOverlay}
        <button
          className={cn(buttonVariants({ variant, size, align, className }))}
          ref={ref as React.Ref<HTMLButtonElement>}
          data-state={loading ? "loading" : undefined}
          data-disabled={isDisabled || undefined}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          disabled={isDisabled}
          onClick={onClick}
          {...props}
        >
          {renderInner(children)}
        </button>
      </>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

const useGlobalSpinnerOverlay = (loading: boolean, label: string) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !loading || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
      <Loader2 aria-hidden className="mb-2 size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label || "Processing..."}</p>
    </div>,
    document.body
  )
}
