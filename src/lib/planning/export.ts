import type { PlanningDataExport } from "../db/repositories";

export function serializePlanningData(data: PlanningDataExport): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}
