'use client';

import { useState } from 'react';
import type { TimeSlot } from '@packages/shared-types';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  selectedSlotId?: string;
}

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

export function TimeSlotPicker({
  slots,
  onSelectSlot,
  selectedSlotId,
}: TimeSlotPickerProps) {
  const [internalSelection, setInternalSelection] = useState<string>();
  const activeSlotId = selectedSlotId ?? internalSelection;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => {
        const selected = activeSlotId === slot.slotId;
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);

        return (
          <button
            key={slot.slotId}
            type="button"
            disabled={!slot.isAvailable}
            aria-pressed={selected}
            onClick={() => {
              setInternalSelection(slot.slotId);
              onSelectSlot(slot);
            }}
            className={[
              'rounded-xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:ring-offset-2 active:scale-[0.98]',
              slot.isAvailable
                ? selected
                  ? 'border-teal-600 bg-teal-50/60 text-teal-900 ring-1 ring-teal-500'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50/40'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">
              {timeFormatter.format(start)} – {timeFormatter.format(end)}
            </span>
            <span className={`mt-1 block text-xs ${slot.isAvailable ? 'text-medical-700' : 'text-slate-400'}`}>
              {slot.isAvailable ? 'Còn trống' : 'Đã kín lịch'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
