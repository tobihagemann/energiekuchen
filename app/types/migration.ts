// Legacy v1.0 format types for migration
interface V1Activity {
  id: string;
  name: string;
  value: number;
}

export interface V1Data {
  version?: string;
  positive?: { activities: V1Activity[] };
  negative?: { activities: V1Activity[] };
}

// Type-safe unknown types for validation during import
export interface UnknownData {
  version?: string;
  positive?: unknown;
  negative?: unknown;
  current?: { activities?: unknown[] };
  desired?: { activities?: unknown[] };
}

export interface UnknownActivity {
  id?: unknown;
  name?: unknown;
  value?: unknown;
  [key: string]: unknown;
}
