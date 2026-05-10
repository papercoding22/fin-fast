import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { vi } from "date-fns/locale";

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// value/onChange use 'YYYY-MM-DD' string format
export default function DatePicker({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef(null);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const label = selected
    ? selected.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chọn ngày...";

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSelect(day) {
    if (!day) return;
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setAlignRight(rect.left + 288 > window.innerWidth);
          }
          setOpen((o) => !o);
        }}
        className="w-full flex items-center justify-between gap-2 border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>{label}</span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 ${alignRight ? "right-0" : "left-0"} rounded-xl bg-white shadow-xl border border-slate-200 p-3 w-72`}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            locale={vi}
            showOutsideDays
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? <ChevronLeft /> : <ChevronRight />,
            }}
            classNames={{
              root: "relative",
              months: "flex flex-col",
              month_caption: "flex justify-center items-center h-9 mb-2",
              caption_label: "text-sm font-semibold text-slate-800 capitalize",
              nav: "absolute top-0 inset-x-0 h-9 flex items-center justify-between px-0.5 pointer-events-none",
              button_previous:
                "pointer-events-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none",
              button_next:
                "pointer-events-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none",
              weekdays: "flex",
              weekday:
                "w-9 h-8 flex items-center justify-center text-xs text-slate-400 font-medium",
              weeks: "space-y-0.5",
              week: "flex",
              day: "flex items-center justify-center",
              day_button:
                "w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-slate-100",
              selected: "bg-blue-600! text-white! hover:bg-blue-700!",
              today: "font-bold text-blue-600",
              outside: "opacity-30",
              disabled: "opacity-20 pointer-events-none",
            }}
          />
        </div>
      )}
    </div>
  );
}
