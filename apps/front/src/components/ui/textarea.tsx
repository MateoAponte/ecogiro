import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border-[1.5px] border-gray-300 bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:border-gray-400 focus-visible:outline-none focus-visible:border-primary focus-visible:border-2 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
