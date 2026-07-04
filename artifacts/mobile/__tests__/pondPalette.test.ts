import { timeOfDay } from "@/constants/pondPalette";

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("timeOfDay pond palette", () => {
  it("returns a stable dawn palette for early garden levels (<= 2)", () => {
    expect(timeOfDay(1)).toEqual(timeOfDay(2));
  });

  it("returns a stable day palette for mid garden levels (3-5)", () => {
    expect(timeOfDay(3)).toEqual(timeOfDay(4));
    expect(timeOfDay(4)).toEqual(timeOfDay(5));
  });

  it("returns a stable dusk palette for high garden levels (>= 6)", () => {
    expect(timeOfDay(6)).toEqual(timeOfDay(7));
    expect(timeOfDay(7)).toEqual(timeOfDay(20));
  });

  it("shifts the base water color across all three time-of-day bands", () => {
    const dawn = timeOfDay(2).grad[0];
    const day = timeOfDay(5).grad[0];
    const dusk = timeOfDay(6).grad[0];
    expect(new Set([dawn, day, dusk]).size).toBe(3);
  });

  it("crosses the day boundary exactly at level 3 and dusk at level 6", () => {
    expect(timeOfDay(2)).not.toEqual(timeOfDay(3));
    expect(timeOfDay(5)).not.toEqual(timeOfDay(6));
  });

  it("provides a complete, valid palette for every band", () => {
    for (const level of [1, 4, 7]) {
      const p = timeOfDay(level);
      expect(p.grad).toHaveLength(3);
      p.grad.forEach((c) => expect(c).toMatch(HEX));
      expect(p.poolInner).toMatch(HEX);
      expect(p.poolMid).toMatch(HEX);
      expect(p.ripple).toMatch(HEX);
      expect(p.caustic).toMatch(HEX);
    }
  });

  it("stays defensively on the dawn palette for non-positive levels", () => {
    expect(timeOfDay(0)).toEqual(timeOfDay(1));
  });
});
