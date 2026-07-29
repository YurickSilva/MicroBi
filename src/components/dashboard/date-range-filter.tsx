"use client";

import { useDataStore } from "@/store/use-data-store";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Converte uma string "YYYY-MM-DD" em um Date no horário LOCAL (meia-noite local),
 * em vez de UTC. Evita o bug clássico onde `new Date("2025-12-30")` é interpretado
 * como UTC e "volta" um dia ao ser exibido em fusos negativos (ex: Brasil, UTC-3).
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Converte um Date (horário local) de volta para "YYYY-MM-DD", sem passar por UTC.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateToDayIndex(date: string, min: string): number {
  return Math.floor((parseLocalDate(date).getTime() - parseLocalDate(min).getTime()) / 86400000);
}

function dayIndexToDate(index: number, min: string): string {
  const d = parseLocalDate(min);
  d.setDate(d.getDate() + index);
  return formatLocalDate(d);
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
    setDateRangeFilter([formatLocalDate(date), currentRange[1]]);
  }

  function handleEndDateChange(date: Date | undefined) {
    if (!date) return;
    setDateRangeFilter([currentRange[0], formatLocalDate(date)]);
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
              key={currentRange[0]}
              mode="single"
              selected={parseLocalDate(currentRange[0])}
              defaultMonth={parseLocalDate(currentRange[0])}
              onSelect={handleStartDateChange}
              disabled={(date) =>
                date < parseLocalDate(min) || date > parseLocalDate(currentRange[1])
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
              key={currentRange[1]}
              mode="single"
              selected={parseLocalDate(currentRange[1])}
              defaultMonth={parseLocalDate(currentRange[1])}
              onSelect={handleEndDateChange}
              disabled={(date) =>
                date > parseLocalDate(max) || date < parseLocalDate(currentRange[0])
              }
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}