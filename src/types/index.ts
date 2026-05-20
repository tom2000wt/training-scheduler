export interface Course {
  id?: number;
  subject: string;
  grade: string;
  className: string;
  classroom: string;
  startTime: string;
  endTime: string;
  repeatType: 'none' | 'weekly' | 'biweekly';
  startDate: string;
  endDate?: string;
  color: string;
  status: 'active' | 'archived';
  notes: string;
}

export interface ScheduleException {
  id?: number;
  courseId: number;
  originalDate: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  exceptionType: 'rescheduled' | 'cancelled';
  reason: string;
}

export interface Holiday {
  id?: number;
  date: string;
  label: string;
}

export interface StatisticsQuery {
  startDate: string;
  endDate: string;
}

export interface StatisticsResult {
  subject: string;
  grade: string;
  totalHours: number;
  courseCount: number;
}

export interface ImportPreview {
  courses: Course[];
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  courseA: string;
  courseB: string;
  conflictType: string;
  description: string;
}

export interface ExportCourseItem {
  date: string;
  dayOfWeek: string;
  subject: string;
  grade: string;
  className: string;
  classroom: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
}

export type ViewMode = 'day' | 'week' | 'month';
export type SidebarTab = 'calendar' | 'courses' | 'statistics' | 'import' | 'settings';
