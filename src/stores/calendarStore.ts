import { create } from 'zustand';
import { api } from '../api';
import type { Course, ScheduleException, Holiday } from '../types';

interface CalendarState {
  courses: Course[];
  exceptions: Map<number, ScheduleException[]>;
  holidays: Holiday[];
  loading: boolean;

  loadCourses: () => Promise<void>;
  loadHolidays: () => Promise<void>;
  addCourse: (course: Course) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  removeCourse: (id: number) => Promise<void>;
  addException: (exception: ScheduleException) => Promise<void>;
  removeException: (id: number) => Promise<void>;
  addHoliday: (holiday: Holiday) => Promise<void>;
  removeHoliday: (id: number) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  courses: [],
  exceptions: new Map(),
  holidays: [],
  loading: false,

  loadCourses: async () => {
    set({ loading: true });
    const courses = await api.getCourses();
    set({ courses, loading: false });
  },

  loadHolidays: async () => {
    const holidays = await api.getHolidays();
    set({ holidays });
  },

  addCourse: async (course) => {
    const created = await api.createCourse(course);
    set((s) => ({ courses: [...s.courses, created] }));
    return created;
  },

  updateCourse: async (course) => {
    await api.updateCourse(course);
    set((s) => ({
      courses: s.courses.map((c) => (c.id === course.id ? course : c)),
    }));
  },

  removeCourse: async (id) => {
    await api.deleteCourse(id);
    set((s) => ({
      courses: s.courses.filter((c) => c.id !== id),
    }));
  },

  addException: async (exception) => {
    const created = await api.createException(exception);
    set((s) => {
      const m = new Map(s.exceptions);
      const list = m.get(exception.courseId) || [];
      list.push(created);
      m.set(exception.courseId, list);
      return { exceptions: m };
    });
  },

  removeException: async (id) => {
    await api.deleteException(id);
    set((s) => {
      const m = new Map(s.exceptions);
      for (const [key, list] of m) {
        m.set(
          key,
          list.filter((e) => e.id !== id),
        );
      }
      return { exceptions: m };
    });
  },

  addHoliday: async (holiday) => {
    const created = await api.createHoliday(holiday);
    set((s) => ({ holidays: [...s.holidays, created] }));
  },

  removeHoliday: async (id) => {
    await api.deleteHoliday(id);
    set((s) => ({
      holidays: s.holidays.filter((h) => h.id !== id),
    }));
  },
}));
