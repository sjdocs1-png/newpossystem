import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:from-primary/95 hover:to-accent/90",
        destructive: "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90",
        outline: "border border-input bg-background text-foreground hover:border-primary hover:text-primary",
        secondary: "bg-card text-foreground border border-border hover:bg-muted/80",
        ghost: "bg-transparent text-foreground hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        red: "bg-red-700 text-white hover:bg-red-600 border-transparent shadow-md shadow-red-500/10",
        blue: "bg-sky-700 text-white hover:bg-sky-600 border-transparent shadow-md shadow-sky-500/15",
        yellow: "bg-amber-600 text-slate-900 hover:bg-amber-500 border-transparent shadow-md shadow-amber-500/15",
        green: "bg-emerald-600 text-white hover:bg-emerald-500 border-transparent shadow-md shadow-emerald-500/15",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-[1.5rem] px-8 text-base",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
