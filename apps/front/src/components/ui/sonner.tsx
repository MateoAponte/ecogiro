import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={60}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--eco-green-light))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-[hsl(var(--eco-green-light))] group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-[hsl(var(--eco-green-light))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-[hsl(var(--eco-green-light))]",
          success: "group-[.toaster]:bg-[hsl(var(--eco-green-light))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-[hsl(var(--eco-green-light))]",
          warning: "group-[.toaster]:bg-[hsl(var(--eco-green-light))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-[hsl(var(--eco-green-light))]",
          info: "group-[.toaster]:bg-[hsl(var(--eco-green-light))] group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-[hsl(var(--eco-green-light))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
