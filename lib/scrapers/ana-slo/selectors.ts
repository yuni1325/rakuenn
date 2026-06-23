/**
 * ana-slo.com の DOM セレクタ定義
 * サイト構造変更時はこのファイルのみ更新する
 */
export const anaSloSelectors = {
  cloudflareBlockedTitles: ["Just a moment", "しばらく", "セキュリティ"],
  listPage: {
    dateTable: ".date-table",
    dateLinks: '.date-table a[href*="-data"]',
    dateLink: (dateKey: string, detailUrlSlug: string) =>
      `.date-table a[href*="${dateKey}"][href*="${detailUrlSlug}"][href*="-data"]`,
  },
  detailPage: {
    dataTable: "#all_data_table",
    dataRows: "#all_data_table tbody tr",
    machineNameCell: "td.fixed01",
    dataCells: "td.table_cells",
  },
} as const;

export const anaSloTableColumns = {
  machineNo: 0,
  totalGames: 1,
  diffMedals: 2,
  bbCount: 3,
  rbCount: 4,
} as const;
