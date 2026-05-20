import * as XLSX from 'xlsx';

export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string,
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
