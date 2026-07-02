/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LangProvider } from "@/context/LangContext";
import { RsvpTable, type RsvpRow } from "./RsvpTable";

function renderTable(rows: RsvpRow[]) {
  return render(
    <LangProvider>
      <RsvpTable rows={rows} />
    </LangProvider>
  );
}

function makeRow(overrides: Partial<RsvpRow> = {}): RsvpRow {
  return {
    id: crypto.randomUUID(),
    attend_or_absent: "attend",
    number_of_participants: 2,
    name: "Budi Santoso",
    email_address: "budi@example.com",
    age: 30,
    postcode: "12345",
    address: "Jl. Sudirman No. 1, Jakarta",
    phone_number: "08123456789",
    dietary_restrictions: null,
    message: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("RsvpTable — empty state", () => {
  it("renders the no-data message with no filter chips, CSV button, or table", () => {
    renderTable([]);
    expect(screen.getByText("No RSVP data yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("csv-download")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rsvp-table")).not.toBeInTheDocument();
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });
});

describe("RsvpTable — non-empty state", () => {
  it("renders filter chips, CSV button, and table", () => {
    renderTable([makeRow()]);
    expect(screen.getByTestId("csv-download")).toBeInTheDocument();
    expect(screen.getByTestId("rsvp-table")).toBeInTheDocument();
    expect(screen.getAllByText("All").length).toBeGreaterThan(0);
  });
});

describe("RsvpTable — filtering", () => {
  const rows = [
    makeRow({ id: "1", attend_or_absent: "attend", dietary_restrictions: "Alergi kacang" }),
    makeRow({ id: "2", attend_or_absent: "absent", dietary_restrictions: null }),
  ];

  it("narrows to attend-only rows via the attendance filter chip", () => {
    renderTable(rows);
    fireEvent.click(screen.getByText("Attending only"));
    expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 2")).toBeInTheDocument();
  });

  it("resets to all rows via the all chip after filtering", () => {
    renderTable(rows);
    fireEvent.click(screen.getByText("Attending only"));
    const allChips = screen.getAllByText("All");
    fireEvent.click(allChips[0]);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it("narrows to rows with dietary restrictions via the dietary filter chip", () => {
    renderTable(rows);
    fireEvent.click(screen.getByText("Has restrictions"));
    expect(screen.getByText("Showing 1 of 2")).toBeInTheDocument();
  });

  it("combines attendance and dietary filters with AND logic", () => {
    renderTable([
      makeRow({ id: "1", attend_or_absent: "attend", dietary_restrictions: "Alergi kacang" }),
      makeRow({ id: "2", attend_or_absent: "attend", dietary_restrictions: null }),
      makeRow({ id: "3", attend_or_absent: "absent", dietary_restrictions: "Vegetarian" }),
    ]);
    fireEvent.click(screen.getByText("Attending only"));
    fireEvent.click(screen.getByText("Has restrictions"));
    expect(screen.getByText("Showing 1 of 3")).toBeInTheDocument();
  });

  it("shows the no-matching-data message when a filter combination yields zero rows", () => {
    renderTable([makeRow({ attend_or_absent: "attend", dietary_restrictions: null })]);
    fireEvent.click(screen.getByText("Not attending only"));
    expect(screen.getByText("No data matches the current filters.")).toBeInTheDocument();
    expect(screen.queryByTestId("rsvp-table")).not.toBeInTheDocument();
  });

  it("does not show the filtered-count text when filtered equals total", () => {
    renderTable(rows);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});

describe("RsvpTable — CSV export", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let capturedBlob: Blob | undefined;

  beforeEach(() => {
    capturedBlob = undefined;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("neutralizes formula-injection payloads in the exported CSV", async () => {
    renderTable([
      makeRow({ name: "=SUM(A1:A9)", address: "+62 Jl. Merdeka" }),
    ]);

    fireEvent.click(screen.getByTestId("csv-download"));

    expect(capturedBlob).toBeDefined();
    const csvText = await capturedBlob!.text();

    expect(csvText).toContain("Name");
    expect(csvText).toContain("'=SUM(A1:A9)");
    expect(csvText).toContain("'+62 Jl. Merdeka");
    expect(csvText).not.toMatch(/(?<!')="?SUM/);
  });
});
