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

// Legacy v2.0 format types for migration
interface V2Activity {
  id: string;
  name: string;
  value: number;
  details?: string;
}

interface V2Chart {
  activities: V2Activity[];
}

export interface V2Data {
  version?: string;
  current?: V2Chart;
  desired?: V2Chart;
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
  weight?: unknown;
  polarity?: unknown;
  labelOffset?: unknown;
  [key: string]: unknown;
}
