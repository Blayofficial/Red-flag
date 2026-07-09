import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400",
  secondary: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
  danger: "bg-transparent text-red-400 hover:bg-red-500/10",
  ghost: "bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
