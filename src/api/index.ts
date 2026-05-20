import { invoke } from '@tauri-apps/api/core';
import type {
  Course,
  ScheduleException,
  Holiday,
  StatisticsQuery,
  StatisticsResult,
  ImportPreview,
} from '../types';

export const api = {
  // Courses
  getCourses: () => invoke<Course[]>('get_courses'),
  createCourse: (course: Course) => invoke<Course>('create_course', { course }),
  updateCourse: (course: Course) => invoke<void>('update_course', { course }),
  deleteCourse: (id: number) => invoke<void>('delete_course', { id }),

  // Exceptions
  getExceptions: (courseId: number) =>
    invoke<ScheduleException[]>('get_exceptions', { courseId }),
  createException: (exception: ScheduleException) =>
    invoke<ScheduleException>('create_exception', { exception }),
  deleteException: (id: number) => invoke<void>('delete_exception', { id }),

  // Holidays
  getHolidays: () => invoke<Holiday[]>('get_holidays'),
  createHoliday: (holiday: Holiday) => invoke<Holiday>('create_holiday', { holiday }),
  deleteHoliday: (id: number) => invoke<void>('delete_holiday', { id }),
  batchCreateHolidays: (holidays: Holiday[]) =>
    invoke<number>('batch_create_holidays', { holidays }),

  // Statistics
  getStatistics: (query: StatisticsQuery) =>
    invoke<StatisticsResult[]>('get_statistics', { query }),

  // Excel import
  previewExcelImport: (filePath: string) =>
    invoke<ImportPreview>('preview_excel_import', { filePath }),
  executeExcelImport: (filePath: string, mode: 'append' | 'replace') =>
    invoke<number>('execute_excel_import', { filePath, mode }),
};
