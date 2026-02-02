'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (value: DateRange) => void;
  presets?: string[];
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  presets = ['today', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days'],
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // 快捷选项
  const presetOptions = {
    today: {
      label: '今日',
      getRange: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    thisWeek: {
      label: '本周',
      getRange: () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 周一
        const start = new Date(now);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return { from: start, to: now };
      },
    },
    thisMonth: {
      label: '本月',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: start, to: now };
      },
    },
    last7Days: {
      label: '近7天',
      getRange: () => {
        const end = new Date();
        const start = subDays(end, 6);
        return { from: start, to: end };
      },
    },
    last30Days: {
      label: '近30天',
      getRange: () => {
        const end = new Date();
        const start = subDays(end, 29);
        return { from: start, to: end };
      },
    },
  };

  const handlePresetClick = (presetKey: string) => {
    const preset = presetOptions[presetKey as keyof typeof presetOptions];
    if (preset) {
      const range = preset.getRange();
      onChange(range);
      setIsOpen(false);
    }
  };

  const daysCount = value?.from && value?.to
    ? Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[300px] justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'yyyy-MM-dd')} - {format(value.to, 'yyyy-MM-dd')}
              </>
            ) : (
              format(value.from, 'yyyy-MM-dd')
            )
          ) : (
            <span>选择时间范围</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="text-sm font-medium mb-2">快捷选择</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const option = presetOptions[preset as keyof typeof presetOptions];
              if (!option) return null;
              return (
                <Button
                  key={preset}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  type="button"
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
        {daysCount > 0 && (
          <div className="p-3 border-t text-sm text-muted-foreground">
            共 {daysCount} 天
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
