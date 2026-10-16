import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [hoveredDay, setHoveredDay] = React.useState<Date | undefined>();
  
  // Get the selected range from props
  const selectedRange = props.mode === "range" ? (props.selected as DateRange | undefined) : undefined;
  const rangeStart = selectedRange?.from;
  const rangeEnd = selectedRange?.to;
  
  // Calculate if a day is in the hover range (after first selection, before second)
  const isInHoverRange = React.useCallback((day: Date) => {
    if (!rangeStart || rangeEnd || !hoveredDay) return false;
    
    const dayTime = day.getTime();
    const startTime = rangeStart.getTime();
    const hoverTime = hoveredDay.getTime();
    
    if (hoverTime >= startTime) {
      return dayTime > startTime && dayTime <= hoverTime;
    } else {
      return dayTime < startTime && dayTime >= hoverTime;
    }
  }, [rangeStart, rangeEnd, hoveredDay]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 border-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200 inline-flex items-center justify-center",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/15",
          "[&:has(.day-outside)]:bg-transparent"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-lg",
          "hover:bg-primary/15 hover:text-primary",
          "focus:bg-primary/15 focus:text-primary",
          "aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start bg-primary text-primary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground !ring-0 !outline-none",
        day_range_end: "day-range-end bg-primary text-primary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground !ring-0 !outline-none",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg",
        day_today: "border-2 border-primary text-primary font-bold bg-transparent hover:bg-primary/15 rounded-lg",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-transparent aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "day-range-middle aria-selected:bg-primary/15 aria-selected:text-primary rounded-none hover:bg-primary/15",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      modifiers={{
        hoverRange: (day) => isInHoverRange(day),
      }}
      modifiersClassNames={{
        hoverRange: "bg-primary/15 text-primary rounded-none",
      }}
      onDayMouseEnter={(day) => setHoveredDay(day)}
      onDayMouseLeave={() => setHoveredDay(undefined)}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
