export function formatYuan(n: number): string {
  const abs = Math.abs(n);
  const fraction = abs > 0 && abs < 1 ? 4 : abs < 100 ? 2 : 2;
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fraction,
  }).format(n);
}
