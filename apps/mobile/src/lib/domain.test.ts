import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bookingStatusFr,
  countSeats,
  defaultMinibusLayout,
  fmtCountdown,
  fmtDateKey,
  fmtTime,
  HOLD_DURATION_MS,
  makeQrToken,
  makeReference,
  parseSeatLayout,
  seatKeyFor,
  seatLabel,
  toDateKey,
  toMs,
  type SeatCell,
} from "./domain";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("seat layouts", () => {
  const customLayout: SeatCell[] = [
    { row: 0, col: 3, type: "driver" },
    { row: 1, col: 0, type: "seat", label: "A1" },
    { row: 1, col: 1, type: "door" },
  ];

  it.each([
    [customLayout, customLayout],
    [{ layout: customLayout }, customLayout],
    [JSON.stringify(customLayout), customLayout],
    [JSON.stringify({ layout: customLayout }), customLayout],
  ])("normalizes a stored custom layout", (snapshot, expected) => {
    expect(parseSeatLayout(snapshot, 18)).toEqual(expected);
  });

  it("keeps valid cells and drops malformed entries from a mixed snapshot", () => {
    expect(
      parseSeatLayout(
        [
          null,
          { row: 1, col: 0, type: "seat", label: "A1" },
          { row: 1, col: 1, type: "seat", label: 2 },
          { row: "1", col: 2, type: "aisle" },
          { row: 1, col: 3, type: "window" },
        ],
        20,
      ),
    ).toEqual([
      { row: 1, col: 0, type: "seat", label: "A1" },
      { row: 1, col: 1, type: "seat", label: undefined },
    ]);
  });

  it.each([null, { rows: [] }, "not-json", [], [{ row: "bad", col: 0, type: "seat" }]])(
    "falls back for a missing or malformed snapshot",
    (snapshot) => {
      const layout = parseSeatLayout(snapshot, 5);

      expect(countSeats(layout)).toBe(5);
      expect(layout[0]).toEqual({ row: 0, col: 3, type: "driver" });
    },
  );

  it("builds rows of four numbered seats around an aisle", () => {
    const layout = defaultMinibusLayout(5);

    expect(layout).toEqual([
      { row: 0, col: 3, type: "driver" },
      { row: 1, col: 0, type: "seat", label: "1" },
      { row: 1, col: 1, type: "seat", label: "2" },
      { row: 1, col: 3, type: "seat", label: "3" },
      { row: 1, col: 4, type: "seat", label: "4" },
      { row: 1, col: 2, type: "aisle" },
      { row: 2, col: 0, type: "seat", label: "5" },
      { row: 2, col: 2, type: "aisle" },
    ]);
    expect(countSeats(layout)).toBe(5);
  });

  it.each([0, -4])("returns only the driver for non-positive totals (%s)", (total) => {
    expect(defaultMinibusLayout(total)).toEqual([{ row: 0, col: 3, type: "driver" }]);
  });

  it("formats seat labels and stable trip-scoped seat keys", () => {
    expect(seatLabel({ row: 1, col: 0, type: "seat", label: "B2" }, 4)).toBe("B2");
    expect(seatLabel({ row: 1, col: 0, type: "seat" }, 4)).toBe("5");
    expect(seatKeyFor("trip-123", "B2")).toBe("trip-123_B2");
  });
});

describe("booking identifiers", () => {
  it("generates an unambiguous six-character booking reference", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(makeReference()).toBe("CP-AAAAAA");
    expect(makeReference()).toMatch(/^CP-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("combines two random blocks with the current timestamp in QR tokens", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    expect(makeQrToken()).toBe(`AAAAAAAAAAAAAAAA${(1_700_000_000_000).toString(36).toUpperCase()}`);
  });
});

describe("dates and countdowns", () => {
  it("uses local calendar fields for date keys", () => {
    expect(toDateKey(new Date(2026, 5, 9, 23, 30))).toBe("2026-06-09");
    expect(toDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("formats valid date keys in French and preserves malformed keys", () => {
    expect(fmtDateKey("2026-06-19")).toBe("19 juin 2026");
    expect(fmtDateKey("2026-02-03")).toBe("3 févr. 2026");
    expect(fmtDateKey("2026/06/19")).toBe("2026/06/19");
    expect(fmtDateKey("2026-13-19")).toBe("2026-13-19");
    expect(fmtDateKey("2026-no-19")).toBe("2026-no-19");
  });

  it("formats valid local times and returns a placeholder for absent or invalid values", () => {
    const instant = new Date(2026, 5, 19, 6, 5).getTime();

    expect(fmtTime(instant)).toBe("06:05");
    expect(fmtTime(new Date(instant).toISOString())).toBe("06:05");
    expect(fmtTime(null)).toBe("--:--");
    expect(fmtTime(undefined)).toBe("--:--");
    expect(fmtTime("not-a-date")).toBe("--:--");
  });

  it("coerces supported date values to milliseconds", () => {
    const iso = "2026-06-19T03:05:00.000Z";

    expect(toMs(1234)).toBe(1234);
    expect(toMs(iso)).toBe(new Date(iso).getTime());
    expect(toMs(null)).toBe(0);
    expect(toMs(undefined)).toBe(0);
    expect(toMs("invalid")).toBe(0);
  });

  it.each([
    [-1, "00:00"],
    [0, "00:00"],
    [999, "00:00"],
    [1_000, "00:01"],
    [61_999, "01:01"],
    [HOLD_DURATION_MS, "05:00"],
  ])("formats %s milliseconds as %s", (milliseconds, expected) => {
    expect(fmtCountdown(milliseconds)).toBe(expected);
  });
});

describe("booking statuses", () => {
  it.each([
    ["paid", "Payé", "success"],
    ["succeeded", "Payé", "success"],
    ["confirmed", "Confirmé", "success"],
    ["pending", "À payer à bord", "warning"],
    ["cancelled", "Annulé", "danger"],
    ["expired", "Expiré", "danger"],
    ["failed", "Échoué", "danger"],
    ["refunded", "Remboursé", "neutral"],
    ["partially_refunded", "Remb. partiel", "neutral"],
    ["completed", "Terminé", "neutral"],
  ] as const)("maps %s to its French label and tone", (status, label, tone) => {
    expect(bookingStatusFr(status)).toEqual({ label, tone });
  });

  it("turns unknown statuses into neutral readable fallbacks", () => {
    expect(bookingStatusFr("waiting_review")).toEqual({ label: "Waiting_review", tone: "neutral" });
    expect(bookingStatusFr("")).toEqual({ label: "—", tone: "neutral" });
  });
});
