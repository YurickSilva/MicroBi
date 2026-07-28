"use client";

import { useDataStore } from "@/store/use-data-store";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function dateToDayIndex(date: string, min: string): number {
  return Math.floor((new Date(date).getTime() - new Date(min).getTime()) / 86400000);
}

function dayIndexToDate(index: number, min: string): string {
  const d = new Date(min);
  d.setDate(d.getDate() + index);
  return d.toISOString().split("T")[0];
}

export function DateRangeFilter() {
  const dateBounds = useDataStore((s) => s.dateBounds);
  const dateRange = useDataStore((s) => s.activeFilters.dateRange);
  const setDateRangeFilter = useDataStore((s) => s.setDateRangeFilter);

  if (!dateBounds) return null;

  const { min, max } = dateBounds;
  const maxDayIndex = dateToDayIndex(max, min);

  const currentRange = dateRange ?? [min, max];
  const sliderValue = [
    dateToDayIndex(currentRange[0], min),
    dateToDayIndex(currentRange[1], min),
  ];

  function handleSliderChange(value: number | readonly number[]) {
    if (!Array.isArray(value) || value.length < 2) return;
    const [startIdx, endIdx] = value as number[];
    setDateRangeFilter([dayIndexToDate(startIdx, min), dayIndexToDate(endIdx, min)]);
  }

  function handleStartDateChange(date: Date | undefined) {
    if (!date) return;
    const newStart = date.toISOString().split("T")[0];
    setDateRangeFilter([newStart, currentRange[1]]);
  }

  function handleEndDateChange(date: Date | undefined) {
    if (!date) return;
    const newEnd = date.toISOString().split("T")[0];
    setDateRangeFilter([currentRange[0], newEnd]);
  }

  return (
    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Período</h3>
        {dateRange && (
          <Button variant="ghost" size="sm" onClick={() => setDateRangeFilter(null)}>
            Limpar
          </Button>
        )}
      </div>

      <Slider
        min={0}
        max={maxDayIndex}
        step={1}
        value={sliderValue}
        onValueChange={handleSliderChange}
        className="my-2"
      />

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-start text-xs")}
          >
            {currentRange[0]}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(currentRange[0])}
              onSelect={handleStartDateChange}
              disabled={(date) =>
                date < new Date(min) || date > new Date(currentRange[1])
              }
            />
          </PopoverContent>
        </Popover>

        <span className="text-zinc-500 text-xs">até</span>

        <Popover>
          <PopoverTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-start text-xs")}
          >
            {currentRange[1]}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(currentRange[1])}
              onSelect={handleEndDateChange}
              disabled={(date) =>
                date > new Date(max) || date < new Date(currentRange[0])
              }
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}