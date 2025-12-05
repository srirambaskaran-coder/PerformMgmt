// Lightweight augmentation store (no DB schema changes)
// Persists extended fields originally present in Postgres/Drizzle but absent from current MSSQL schema/SPs.
// Uses in-memory Map plus optional JSON file snapshot for durability across short restarts.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

interface InitiatedAppraisalAugmentation {
  id: string;
  appraisalGroupId?: string;
  appraisalType?: "questionnaire_based" | "kpi_based" | "mbo_based" | "okr_based";
  questionnaireTemplateIds?: string[] | null;
  documentUrl?: string | null;
  frequencyCalendarId?: string | null;
  daysToInitiate?: number | null;
  daysToClose?: number | null;
  numberOfReminders?: number | null;
  excludeTenureLessThanYear?: boolean | null;
  excludedEmployeeIds?: string[] | null;
  makePublic?: boolean | null;
  publishType?: "now" | "as_per_calendar" | null;
}

// ESM-safe __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Persist in a dedicated data folder relative to project root (cwd), fallback to module dir
const dataDir = join(process.cwd(), "data");
try {
  mkdirSync(dataDir, { recursive: true });
} catch {}
const FILE = join(dataDir, "augmentation-data.json");
const initiatedAppraisalMap = new Map<string, InitiatedAppraisalAugmentation>();

function load() {
  if (existsSync(FILE)) {
    try {
      const raw = JSON.parse(
        readFileSync(FILE, "utf-8")
      ) as InitiatedAppraisalAugmentation[];
      for (const entry of raw) initiatedAppraisalMap.set(entry.id, entry);
    } catch {}
  }
}

function persist() {
  try {
    writeFileSync(
      FILE,
      JSON.stringify(Array.from(initiatedAppraisalMap.values()), null, 2)
    );
  } catch {}
}

load();

export function saveInitiatedAppraisalAugmentation(
  aug: InitiatedAppraisalAugmentation
) {
  initiatedAppraisalMap.set(aug.id, aug);
  persist();
}

export function getInitiatedAppraisalAugmentation(
  id: string
): InitiatedAppraisalAugmentation | undefined {
  return initiatedAppraisalMap.get(id);
}

export function mergeInitiatedAppraisal<T extends { id: string }>(
  base: T
): T & InitiatedAppraisalAugmentation {
  const aug = getInitiatedAppraisalAugmentation(base.id);
  return { ...base, ...(aug || {}) };
}
