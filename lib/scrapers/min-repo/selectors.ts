/**
 * min-repo.com の DOM セレクタ定義
 */
export const minRepoSelectors = {
  listPage: {
    dateLinks: 'table a[href*="min-repo.com/"]',
  },
  detailPage: {
    allDataParam: "kishu=all",
    allDataTable: "table:has(th:contains('台番'))",
    dateTime: "time.date",
  },
  tableColumns: {
    groupSize: 5,
    machineName: 0,
    machineNo: 1,
    diffMedals: 2,
    totalGames: 3,
  },
} as const;
