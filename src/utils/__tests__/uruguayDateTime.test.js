import {
  addUruguayDays,
  formatUruguayDateTime,
  uruguayDateKey,
  uruguayDateTimeIso,
} from "../uruguayDateTime";

describe("Uruguay date and time helpers", () => {
  test("uses the Uruguay calendar date regardless of the device timezone", () => {
    expect(uruguayDateKey("2026-09-10T01:30:00Z")).toBe("2026-09-09");
    expect(formatUruguayDateTime("2026-09-10T01:30:00Z")).toContain("9");
  });

  test("builds instants with the Uruguay offset", () => {
    expect(uruguayDateTimeIso("2026-09-09", "22:30")).toBe(
      "2026-09-10T01:30:00.000Z",
    );
  });

  test("moves across month boundaries", () => {
    expect(addUruguayDays("2026-09-30", 1)).toBe("2026-10-01");
  });
});
