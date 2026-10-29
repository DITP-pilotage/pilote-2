import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { mm, px, rem } from "@/server/pdf/units";

dayjs.extend(utc);
dayjs.extend(timezone);

export const PAGE_WIDTH = mm(280);
export const PAGE_HEIGHT = mm(396);
export const PAGE_MARGIN_X = mm(12);
export const PAGE_MARGIN_Y = mm(24);
export const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN_X;
export const GRID_GAP = rem(1.5);
export const BODY_FONT_SIZE = px(16);

export function formatParisDate(
  date: Date | string | null | undefined,
  format: string,
): string | null {
  if (!date) return null;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.tz("Europe/Paris").format(format) : null;
}
