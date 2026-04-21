import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#5F9EA0] text-white hover:bg-[#548f91] focus:ring-[#5F9EA0]/25",
  secondary:
    "bg-[#eef6f5] text-[#576363] hover:bg-[#e1efed] focus:ring-[#5F9EA0]/20",
  ghost:
    "bg-transparent text-[#576363] hover:bg-[#eef6f5] focus:ring-[#5F9EA0]/15",
  outline:
    "border border-[#cfdcda] bg-white text-[#576363] hover:border-[#5F9EA0] hover:text-[#5F9EA0] focus:ring-[#5F9EA0]/15",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function buttonVariants({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-md font-semibold transition focus:outline-none focus:ring-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ className, size, variant })}
      {...props}
    />
  );
}
