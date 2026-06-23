export type SlotDataInput = {
  hallId: string;
  date: Date;
  machineNo: string;
  machineName: string;
  bbCount: number | null;
  rbCount: number | null;
  totalGames: number | null;
  diffMedals: number | null;
};

export type FetchResult = {
  success: boolean;
  days: number;
  records: number;
  successCount: number;
  failureCount: number;
  aborted?: boolean;
  abortReason?: string;
};

export type FetchProgressEvent =
  | { type: "progress"; date: string; status: "completed" | "failed"; message?: string }
  | { type: "aborted"; reason: string }
  | { type: "complete"; result: FetchResult };
