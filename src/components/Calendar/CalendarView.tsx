import { useMemo, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import { Modal, message } from 'antd';
import { useCalendarStore } from '../../stores/calendarStore';
import { useViewStore } from '../../stores/viewStore';
import { parseDate, addWeeks, addMonths } from '../../utils/dateUtils';
import CourseEventContent from './CourseEventContent';
import CourseDetail from '../Course/CourseDetail';
import type { Course } from '../../types';

function generateEvents(
  courses: Course[],
  holidays: Set<string>,
): EventInput[] {
  const events: EventInput[] = [];

  for (const course of courses) {
    if (course.status !== 'active') continue;
    const startDate = parseDate(course.startDate);
    const endDate = course.endDate
      ? parseDate(course.endDate)
      : addMonths(startDate, 6);

    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      if (!holidays.has(dateStr)) {
        events.push({
          id: `${course.id}-${dateStr}`,
          title: course.subject,
          start: `${dateStr}T${course.startTime}`,
          end: `${dateStr}T${course.endTime}`,
          backgroundColor: course.color,
          borderColor: course.color,
          textColor: '#fff',
          extendedProps: {
            courseId: course.id,
            classroom: course.classroom,
            grade: course.grade,
            className: course.className,
          },
        });
      }

      if (course.repeatType === 'weekly') {
        current = addWeeks(current, 1);
      } else if (course.repeatType === 'biweekly') {
        current = addWeeks(current, 2);
      } else {
        break;
      }
    }
  }

  return events;
}

export default function CalendarView() {
  const { courses, holidays, updateCourse } = useCalendarStore();
  const { setViewMode, setCurrentDate } = useViewStore();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  const events = useMemo(
    () => generateEvents(courses, holidaySet),
    [courses, holidaySet],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const courseId = arg.event.extendedProps['courseId'] as number;
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
      }
    },
    [courses],
  );

  const handleEventDrop = useCallback(
    async (arg: EventDropArg) => {
      const courseId = arg.event.extendedProps['courseId'] as number;
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const newStart = arg.event.start;
      if (!newStart) return;

      const newStartTime = newStart.toTimeString().slice(0, 5);
      const newEndTime = arg.event.end
        ? arg.event.end.toTimeString().slice(0, 5)
        : course.endTime;

      Modal.confirm({
        title: '确认调课',
        content: `将 ${course.subject} 调整到 ${newStart.toLocaleDateString()} ${newStartTime}-${newEndTime}？`,
        onOk: async () => {
          const updated = {
            ...course,
            startTime: newStartTime,
            endTime: newEndTime,
            startDate: newStart.toISOString().slice(0, 10),
          };
          await updateCourse(updated);
          message.success('调课成功');
        },
        onCancel: () => arg.revert(),
      });
    },
    [courses, updateCourse],
  );

  return (
    <div style={{ height: '100%', background: '#fff', borderRadius: 8, padding: 16 }}>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={zhLocale}
        events={events}
        editable={true}
        eventDurationEditable={false}
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        height="100%"
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        datesSet={(arg) => {
          setCurrentDate(arg.start.toISOString().slice(0, 10));
          const viewType = arg.view.type;
          if (viewType === 'timeGridDay') setViewMode('day');
          else if (viewType === 'timeGridWeek') setViewMode('week');
          else setViewMode('month');
        }}
        buttonText={{
          today: '今天',
          day: '日',
          week: '周',
          month: '月',
        }}
        eventContent={(arg) => {
          const props = arg.event.extendedProps;
          return (
            <CourseEventContent
              subject={arg.event.title}
              classroom={props['classroom'] as string}
              grade={props['grade'] as string}
              className={props['className'] as string}
            />
          );
        }}
      />

      <CourseDetail course={selectedCourse} open={!!selectedCourse} onClose={() => setSelectedCourse(null)} />
    </div>
  );
}
