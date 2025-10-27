import React from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { cx } from "@/lib/utils";

const progressBarVariants = tv({
  slots: {
    background: "",
    bar: "",
  },
  variants: {
    variant: {
      default: {
        background: "bg-white/20",
        bar: "bg-white",
      },
      neutral: {
        background: "bg-gray-200",
        bar: "bg-gray-500",
      },
      warning: {
        background: "bg-yellow-200",
        bar: "bg-yellow-500",
      },
      error: {
        background: "bg-red-200",
        bar: "bg-red-500",
      },
      success: {
        background: "bg-emerald-200",
        bar: "bg-emerald-500",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ProgressBarProps
  extends React.HTMLProps<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value?: number;
  max?: number;
  showAnimation?: boolean;
  label?: string;
  classNameBar?: string;
  classNameBackground?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value = 0,
      max = 100,
      label,
      showAnimation = false,
      variant,
      className,
      classNameBar,
      classNameBackground,
      ...props
    }: ProgressBarProps,
    forwardedRef
  ) => {
    const safeValue = Math.min(max, Math.max(value, 0));
    const { background, bar } = progressBarVariants({ variant });
    return (
      <div
        ref={forwardedRef}
        className={cx("flex h-1 w-full items-center", className)}
        role="progressbar"
        aria-label="Progress bar"
        aria-valuenow={value}
        aria-valuemax={max}
        tremor-id="tremor-raw"
        {...props}
      >
        <div
          className={cx(
            "relative flex h-1 w-full items-center rounded-full",
            background(),
            classNameBackground
          )}
        >
          <div
            className={cx(
              "h-full flex-col rounded-full",
              bar(),
              showAnimation &&
                "transform-gpu transition-all duration-300 ease-in-out",
              classNameBar
            )}
            style={{
              width: max ? `${(safeValue / max) * 100}%` : `${safeValue}%`,
            }}
          />
        </div>
        {label ? (
          <span
            className={cx(
              "ml-2 whitespace-nowrap text-sm font-medium leading-none",
              "text-gray-900"
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar, progressBarVariants, type ProgressBarProps };
