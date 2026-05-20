import { useMemo, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import { Modal, message, Button, Radio, DatePicker, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import { useViewStore } from '../../stores/viewStore';
import { parseDate, addWeeks, addMonths, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd, formatDate } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelExport';
import { api } from '../../api';
import CourseEventContent from './CourseEventContent';
import CourseDetail from '../Course/CourseDetail';
import type { Course } from '../../types';
import dayjs from 'dayjs';

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

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'week' | 'month' | 'semester' | 'custom'>('week');
  const [exportRange, setExportRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [exporting, setExporting] = useState(false);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  const events = useMemo(
    () => generateEvents(courses, holidaySet),
    [courses, holidaySet],
  );

  const getExportRange = (): [string, string] => {
    const now = new Date();
    switch (exportPeriod) {
      case 'week': {
        const ws = getWeekStart(now);
        return [formatDate(ws), formatDate(getWeekEnd(now))];
      }
      case 'month': {
        return [formatDate(getMonthStart(now)), formatDate(getMonthEnd(now))];
      }
      case 'semester': {
        const m = now.getMonth() + 1;
        if (m >= 2 && m <= 7) {
          return [`${now.getFullYear()}-02-01`, `${now.getFullYear()}-07-31`];
        } else {
          return [`${now.getFullYear()}-08-01`, `${now.getFullYear() + 1}-01-31`];
        }
      }
      case 'custom':
        if (exportRange) {
          return [exportRange[0].format('YYYY-MM-DD'), exportRange[1].format('YYYY-MM-DD')];
        }
        return [formatDate(new Date()), formatDate(new Date())];
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [start, end] = getExportRange();
      const items = await api.exportCourses(start, end);
      if (items.length === 0) {
        message.warning('所选时段内没有课程');
      } else {
        exportToExcel(items as unknown as Record<string, unknown>[], '课表', `课表_${start}_${end}`);
        message.success(`已导出 ${items.length} 条课程记录`);
      }
      setExportOpen(false);
    } catch (e) {
      message.error(String(e));
    } finally {
      setExporting(false);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} onClick={() => setExportOpen(true)}>
          导出课表
        </Button>
      </div>

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
        height="calc(100% - 40px)"
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

      <Modal
        title="导出课表到Excel"
        open={exportOpen}
        onOk={handleExport}
        onCancel={() => setExportOpen(false)}
        confirmLoading={exporting}
        okText="导出"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>选择时段：</div>
          <Radio.Group value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value)}>
            <Space direction="vertical">
              <Radio value="week">本周</Radio>
              <Radio value="month">本月</Radio>
              <Radio value="semester">本学期</Radio>
              <Radio value="custom">自定义范围</Radio>
            </Space>
          </Radio.Group>
        </div>

        {exportPeriod === 'custom' && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>自定义日期范围：</div>
            <DatePicker.RangePicker
              value={exportRange}
              onChange={(v) => setExportRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
