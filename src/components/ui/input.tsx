import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { interactionTokens, stateClasses } from "./foundations"

const textFieldBase = cn(
  "flex w-full rounded-[var(--radius-md)] border bg-background font-medium leading-tight",
  "placeholder:text-muted-foreground",
  "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  interactionTokens.transition,
  stateClasses.disabled,
  "focus-visible:outline-none focus-visible:shadow-focus"
)

const inputVariants = cva(textFieldBase, {
  variants: {
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-3 text-base md:text-sm",
      lg: "h-12 px-4 text-base",
    },
    status: {
      default: "border-input focus-visible:border-primary/60",
      error:
        "border-destructive/70 focus-visible:border-destructive focus-visible:shadow-[0_0_0_2px_hsl(var(--destructive)/0.18)]",
      success:
        "border-success/60 focus-visible:border-success focus-visible:shadow-[0_0_0_2px_hsl(var(--success)/0.2)]",
    },
  },
  defaultVariants: {
    size: "md",
    status: "default",
  },
})

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  status?: "default" | "error" | "success"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size, status = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-status={status === "default" ? undefined : status}
        aria-invalid={status === "error" ? true : undefined}
        className={cn(inputVariants({ size, status, className }))}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export interface InputMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  tone?: "muted" | "error" | "success"
  id?: string
}

export const InputMessage = React.forwardRef<HTMLParagraphElement, InputMessageProps>(
  ({ className, tone = "muted", children, id, ...props }, ref) => {
    if (!children) {
      return null
    }

    const toneClass =
      tone === "error"
        ? "text-sm font-medium text-destructive"
        : tone === "success"
          ? "text-sm font-medium text-success"
          : "text-sm text-muted-foreground"

    return (
      <p
        ref={ref}
        id={id}
        role={tone === "error" ? "alert" : undefined}
        aria-live={tone === "error" ? "assertive" : "polite"}
        className={cn("mt-1", toneClass, className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
InputMessage.displayName = "InputMessage"

export { Input, inputVariants }
