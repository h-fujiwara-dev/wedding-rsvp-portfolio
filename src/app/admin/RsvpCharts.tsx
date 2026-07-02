"use client";

import { motion } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useLang } from "@/context/LangContext";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { RsvpRow } from "./RsvpTable";

const COLORS = {
  attend: "#2C2B1E",
  absent: "#8C8A78",
};

function KpiCard({ label, value, delay }: { label: string; value: number; delay: number }) {

  return (
    <motion.div
      className="bg-wedding-ivory rounded-lg p-6 text-center cursor-default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.76, 0, 0.24, 1] }}
      whileHover={{ y: -4, boxShadow: "0 8px 28px rgba(44,43,30,0.08)" }}
    >
      <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark mb-3">
        {label}
      </p>
      <NumberTicker
        value={value}
        delay={delay}
        className="font-display text-5xl text-wedding-charcoal"
      />
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
  delay,
  srSummary,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  /** Text alternative for the chart — screen readers get no data from the SVG otherwise. */
  srSummary: string;
}) {
  return (
    <motion.div
      className="bg-wedding-ivory rounded-lg p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.76, 0, 0.24, 1] }}
      whileHover={{ y: -3, boxShadow: "0 6px 24px rgba(44,43,30,0.07)" }}
    >
      <h3 className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-taupe-dark mb-6">
        {title}
      </h3>
      <p className="sr-only">{srSummary}</p>
      <div aria-hidden>{children}</div>
    </motion.div>
  );
}

function AttendancePie({ rows }: { rows: RsvpRow[] }) {
  const { t } = useLang();
  const attendCount = rows.filter((r) => r.attend_or_absent === "attend").length;
  const absentCount = rows.filter((r) => r.attend_or_absent === "absent").length;
  const data = [
    { name: t("admin.attend"), value: attendCount },
    { name: t("admin.absent"), value: absentCount },
  ];

  return (
    <ChartCard
      title={t("admin.chart.attendanceRatio")}
      delay={0.35}
      srSummary={`${t("admin.attend")}: ${attendCount}, ${t("admin.absent")}: ${absentCount}`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          >
            <Cell fill={COLORS.attend} />
            <Cell fill={COLORS.absent} />
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DietaryBar({ rows }: { rows: RsvpRow[] }) {
  const { t } = useLang();
  const withDietary = rows.filter(
    (r) => r.attend_or_absent === "attend" && r.dietary_restrictions
  ).length;
  const without = rows.filter(
    (r) => r.attend_or_absent === "attend" && !r.dietary_restrictions
  ).length;
  const data = [
    { category: t("admin.hasDietary"), count: withDietary },
    { category: t("admin.noDietary"), count: without },
  ];

  return (
    <ChartCard
      title={t("admin.chart.dietary")}
      delay={0.55}
      srSummary={`${t("admin.hasDietary")}: ${withDietary}, ${t("admin.noDietary")}: ${without}`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <XAxis dataKey="category" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="count"
            fill={COLORS.attend}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RsvpCharts({ rows }: { rows: RsvpRow[] }) {
  const { t } = useLang();

  if (rows.length === 0) {
    return (
      <p className="font-serif text-wedding-taupe-dark text-center py-12">
        {t("admin.noDataYet")}
      </p>
    );
  }

  const totalParticipants = rows
    .filter((r) => r.attend_or_absent === "attend")
    .reduce((sum, r) => sum + (r.number_of_participants ?? 1), 0);

  const kpis = [
    { label: t("admin.kpi.total"), value: rows.length },
    { label: t("admin.kpi.attending"), value: rows.filter((r) => r.attend_or_absent === "attend").length },
    { label: t("admin.kpi.totalGuests"), value: totalParticipants },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards with count-up */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value }, i) => (
          <KpiCard key={label} label={label} value={value} delay={i * 0.1} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AttendancePie rows={rows} />
        <DietaryBar rows={rows} />
      </div>
    </div>
  );
}
