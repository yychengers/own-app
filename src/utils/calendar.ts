/** 周一为一周起始时，某月 1 号前需要留空的格数（0–6）。 */
export function mondayFirstOffsetCells(year: number, month1to12: number): number {
  const first = new Date(year, month1to12 - 1, 1);
  return (first.getDay() + 6) % 7;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}
