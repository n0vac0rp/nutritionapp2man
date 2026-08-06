import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        "safe-top",
        "safe-bottom",
        "safe-left",
        "safe-right",
        "screen-safe",
        "screen-small",
      ],
      breakpoint: ["xs", "mobile-tall", "mobile-wide"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
