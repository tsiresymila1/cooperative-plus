import { describe, expect, it } from "vitest";
import { scheduleDays } from "./data";

type ScheduleDaysWithOffset = (now: Date, offsetDays?: number) => ReturnType<typeof scheduleDays>;

const buildDays = scheduleDays as ScheduleDaysWithOffset;

describe("scheduleDays", () => {
  const sunday = new Date(2026, 9, 4, 15, 30);

  it("starts with today and returns the next six calendar days", () => {
    const days = buildDays(sunday);

    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ day: "Aujourd'hui", date: "", today: true, key: "2026-10-04" });
    expect(days.map((day) => day.day)).toEqual([
      "Aujourd'hui",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ]);
    expect(days[6]?.date).toBe("10 OCT");
  });

  it("clamps negative navigation to today but allows future windows", () => {
    expect(buildDays(sunday, -7)[0]?.key).toBe("2026-10-04");
    expect(buildDays(sunday, 7)[0]).toEqual({
      day: "Dimanche",
      date: "11 OCT",
      today: false,
      key: "2026-10-11",
    });
  });
});
