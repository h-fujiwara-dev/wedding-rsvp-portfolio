"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/context/LangContext";

export type RsvpRow = {
  id: string;
  attend_or_absent: string;
  number_of_participants: number | null;
  name: string;
  email_address: string;
  age: number | null;
  postcode: string | null;
  address: string | null;
  phone_number: string | null;
  dietary_restrictions: string | null;
  message: string | null;
  created_at: string;
};

type AttendanceFilter = "all" | "attend" | "absent";
type DietaryFilter = "all" | "has" | "none";

type Column = { key: keyof RsvpRow; label: string };

function buildColumns(t: (key: string) => string): Column[] {
  return [
    { key: "name", label: t("admin.col.name") },
    { key: "attend_or_absent", label: t("admin.col.attendance") },
    { key: "number_of_participants", label: t("admin.col.participants") },
    { key: "email_address", label: t("admin.col.email") },
    { key: "age", label: t("admin.col.age") },
    { key: "postcode", label: t("admin.col.postcode") },
    { key: "address", label: t("admin.col.address") },
    { key: "phone_number", label: t("admin.col.phone") },
    { key: "dietary_restrictions", label: t("admin.col.dietary") },
    { key: "message", label: t("admin.col.message") },
    { key: "created_at", label: t("admin.col.createdAt") },
  ];
}

// 自由記述欄は省略せず折り返して全文を表示する
const WRAP_COLUMNS = new Set<keyof RsvpRow>(["address", "dietary_restrictions", "message"]);

function formatCell(col: Column, row: RsvpRow, t: (key: string) => string): string {
  const val = row[col.key];
  if (col.key === "attend_or_absent") return val === "attend" ? t("admin.attend") : t("admin.absent");
  if (col.key === "created_at" && val)
    return new Date(String(val)).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  return val != null ? String(val) : "—";
}

// Excel/Sheets executes cells starting with =, +, -, @ as formulas — prefix
// with ' so exported guest input (name/address/message) can't run as one.
export function neutralizeFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function downloadCsv(rows: RsvpRow[], columns: Column[], t: (key: string) => string) {
  const headers = columns.map((c) => c.label);
  const body = rows.map((row) => columns.map((col) => neutralizeFormula(formatCell(col, row, t))));
  const csv = [headers, ...body]
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "relative px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-sans text-[10px] tracking-[0.2em] uppercase transition-colors border after:absolute after:-inset-y-2.5 after:content-['']",
        active
          ? "bg-wedding-charcoal text-wedding-cream border-wedding-charcoal"
          : "bg-transparent text-wedding-taupe-dark border-wedding-taupe/40 hover:border-wedding-charcoal hover:text-wedding-charcoal",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function RsvpTable({ rows }: { rows: RsvpRow[] }) {
  const { t } = useLang();
  const [attendance, setAttendance] = useState<AttendanceFilter>("all");
  const [dietary, setDietary] = useState<DietaryFilter>("all");
  const columns = useMemo(() => buildColumns(t), [t]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (attendance !== "all" && row.attend_or_absent !== attendance) return false;
        if (dietary === "has" && !row.dietary_restrictions) return false;
        if (dietary === "none" && !!row.dietary_restrictions) return false;
        return true;
      }),
    [rows, attendance, dietary]
  );

  if (rows.length === 0) {
    return <p className="font-serif text-wedding-taupe-dark py-8">{t("admin.noDataYet")}</p>;
  }

  return (
    <div className="space-y-6">
      {/* ── フィルター + CSV ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {/* 出欠フィルター */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-wedding-taupe-dark whitespace-nowrap">
              {t("admin.filter.attendance")}
            </span>
            <FilterChip active={attendance === "all"} onClick={() => setAttendance("all")}>
              {t("admin.filter.all")}
            </FilterChip>
            <FilterChip active={attendance === "attend"} onClick={() => setAttendance("attend")}>
              {t("admin.filter.attendOnly")}
            </FilterChip>
            <FilterChip active={attendance === "absent"} onClick={() => setAttendance("absent")}>
              {t("admin.filter.absentOnly")}
            </FilterChip>
          </div>

          {/* アレルギーフィルター */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-wedding-taupe-dark whitespace-nowrap">
              {t("admin.filter.dietary")}
            </span>
            <FilterChip active={dietary === "all"} onClick={() => setDietary("all")}>
              {t("admin.filter.all")}
            </FilterChip>
            <FilterChip active={dietary === "has"} onClick={() => setDietary("has")}>
              {t("admin.filter.hasDietary")}
            </FilterChip>
            <FilterChip active={dietary === "none"} onClick={() => setDietary("none")}>
              {t("admin.filter.noDietary")}
            </FilterChip>
          </div>
        </div>

        {/* CSV ダウンロード */}
        <button
          type="button"
          onClick={() => downloadCsv(filtered, columns, t)}
          data-testid="csv-download"
          className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.2em] uppercase text-wedding-cream bg-wedding-charcoal px-5 py-2 rounded-full hover:bg-wedding-forest transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("admin.csvDownload").replace("{count}", String(filtered.length))}
        </button>
      </div>

      {/* ── 絞り込み件数表示 ────────────────────────────── */}
      {filtered.length !== rows.length && (
        <p className="font-sans text-[11px] tracking-[0.15em] text-wedding-taupe-dark">
          {t("admin.filteredCount")
            .replace("{total}", String(rows.length))
            .replace("{filtered}", String(filtered.length))}
        </p>
      )}

      {/* ── テーブル ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="font-serif text-wedding-taupe-dark py-8">
          {t("admin.noMatchingData")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-wedding-ivory">
          <table className="w-full text-sm" data-testid="rsvp-table">
            <thead>
              <tr className="bg-wedding-charcoal">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 sm:px-4 sm:py-3 text-left font-sans text-[10px] tracking-[0.2em] uppercase text-wedding-cream/70 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-wedding-cream" : "bg-wedding-ivory"}
                >
                  {columns.map((col) => {
                    const display = formatCell(col, row, t);
                    const isAttend = col.key === "attend_or_absent";
                    const wrap = WRAP_COLUMNS.has(col.key);
                    return (
                      <td
                        key={col.key}
                        className={[
                          "px-3 py-2 sm:px-4 sm:py-3 font-serif",
                          wrap ? "min-w-[220px] max-w-[320px] whitespace-normal break-words" : "max-w-[200px] truncate",
                          isAttend && row.attend_or_absent === "attend"
                            ? "text-wedding-charcoal font-semibold"
                            : "text-wedding-charcoal/80",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={wrap ? undefined : display}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
