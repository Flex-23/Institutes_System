import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_2px_rgb(15_23_42/0.04),0_10px_30px_-16px_rgb(15_23_42/0.12)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("flex items-center gap-2 text-base font-bold text-slate-800", className)} {...props}>
      <span className="inline-block h-4 w-1 rounded-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-2)]" />
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
