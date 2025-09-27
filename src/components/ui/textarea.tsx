import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { interactionTokens, stateClasses } from "./foundations"

const textareaVariants = cva(
  cn(
    "flex min-h-[120px] w-full rounded-[var(--radius-lg)] border bg-background text-sm leading-relaxed",
    "placeholder:text-muted-foreground",
    interactionTokens.transition,
    stateClasses.disabled,
    "focus-visible:outline-none focus-visible:shadow-focus"
  ),
  {
    variants: {
      status: {
        default: "border-input focus-visible:border-primary/60",
        error:
          "border-destructive/70 focus-visible:border-destructive focus-visible:shadow-[0_0_0_2px_hsl(var(--destructive)/0.18)]",
        success:
          "border-success/60 focus-visible:border-success focus-visible:shadow-[0_0_0_2px_hsl(var(--success)/0.2)]",
      },
      density: {
        relaxed: "px-4 py-3",
        comfy: "px-3 py-2",
        compact: "px-3 py-1.5 text-sm",
      },
      resize: {
        y: "resize-y",
        none: "resize-none",
        both: "resize",
      },
    },
    defaultVariants: {
      status: "default",
      density: "relaxed",
      resize: "y",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      status = "default",
      density,
      resize,
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        data-status={status === "default" ? undefined : status}
        aria-invalid={status === "error" ? true : undefined}
        className={cn(textareaVariants({ status, density, resize, className }))}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
