import Link from "next/link";
import { supabaseAdmin, RSVP_TABLE } from "@/lib/supabase";
import { Monogram } from "@/components/Monogram";
import { Trans } from "@/components/Trans";
import { RsvpCharts } from "./RsvpCharts";
import { RsvpTable } from "./RsvpTable";

export const dynamic = "force-dynamic";

async function fetchRsvpData() {
  try {
    const { data, error } = await supabaseAdmin
      .from(RSVP_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { rows: data ?? [], fetchFailed: false };
  } catch {
    return { rows: [], fetchFailed: true };
  }
}

export default async function AdminPage() {
  const { rows, fetchFailed } = await fetchRsvpData();

  return (
    <div className="min-h-screen bg-wedding-cream">
      {/* Header */}
      <header className="bg-wedding-charcoal px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-4">
            <span className="flex items-baseline gap-2 text-xl text-wedding-cream">
              <Monogram />
              <span className="font-display italic text-base text-wedding-cream/70">Admin</span>
            </span>
            <Link
              href="/"
              className="font-sans text-[11px] tracking-[0.2em] uppercase text-wedding-cream/50 hover:text-wedding-cream transition-colors"
            >
              <Trans k="admin.backToHome" />
            </Link>
          </div>
          <span className="font-sans text-[11px] tracking-[0.3em] uppercase text-wedding-cream/50 ml-auto sm:ml-0">
            <Trans k="admin.dashboardLabel" />
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        {fetchFailed && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-6 py-4 font-serif"
          >
            <Trans k="admin.fetchError" />
          </div>
        )}

        {/* Charts */}
        <section>
          <h2 className="font-display text-4xl md:text-5xl text-wedding-charcoal mb-8 tracking-wide">
            <Trans k="admin.aggregation" />
          </h2>
          <RsvpCharts rows={rows} />
        </section>

        {/* Table with filters and CSV export */}
        <section>
          <h2 className="font-display text-4xl md:text-5xl text-wedding-charcoal mb-8 tracking-wide">
            <Trans k="admin.rsvpList" />
          </h2>
          <RsvpTable rows={rows} />
        </section>
      </main>
    </div>
  );
}
