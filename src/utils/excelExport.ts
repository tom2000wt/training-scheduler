import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS = ['科目', '年级', '班级', '教室', '开始时间', '结束时间', '重复类型', '开始日期', '结束日期', '备注'];

const TEMPLATE_SAMPLE = ['数学', '四年级', '大一班', '301', '08:30', '10:00', 'weekly', '2026-02-24', '2026-07-15', '示例数据'];

function downloadXlsx(wb: XLSX.WorkBook, fileName: string) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string,
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  downloadXlsx(wb, `${fileName}.xlsx`);
}

export function exportTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 14 }));
  XLSX.utils.book_append_sheet(wb, ws, '课表模板');
  downloadXlsx(wb, '课表导入模板.xlsx');
}
