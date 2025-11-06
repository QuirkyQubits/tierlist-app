export const TIER_COLORS = [
  "#FF7F7F",
  "#FFBF7F",
  "#FFDF7F",
  "#FFFF7F",
  "#BFFF7F",
  "#7FFF7F",
  "#7FFFFF",
  "#7FBFFF",
  "#7F7FFF",
  "#BF7FFF",
  "#FF7FFF",
  "#FF7FBF",
  "#BFBFBF",
  "#CFCFCF",
] as const;

export const getColorByIndex = (index: number): string =>
  TIER_COLORS[index % TIER_COLORS.length];
