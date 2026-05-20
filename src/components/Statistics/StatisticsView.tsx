import { useState, useMemo } from 'react';
import { Card, DatePicker, Table, Button, Space, Statistic, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import { calculateHours, parseDate, addWeeks, addMonths, formatDate } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelExport';
import type { StatisticsResult, Course, ScheduleException } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function expandCourseHours(
  course: Course,
  rangeStart: Date,
  rangeEnd: Date,
  holidaySet: Set<string>,
  exceptionMap: Map<string, ScheduleException>,
): { hours: number; count: number } {
  const courseStart = parseDate(course.startDate);
  const courseEnd = course.endDate
    ? parseDate(course.endDate)
    : addMonths(courseStart, 6);

  const sessionHours = calculateHours(course.startTime, course.endTime);
  let totalHours = 0;
  let occurrenceCount = 0;

  let current = new Date(courseStart);
  while (current <= courseEnd && current <= rangeEnd) {
    const dateStr = formatDate(current);

    if (current >= rangeStart) {
      const exKey = `${course.id}-${dateStr}`;
      const ex = exceptionMap.get(exKey);

      if (!(ex && ex.exceptionType === 'cancelled') && !holidaySet.has(dateStr)) {
        totalHours += sessionHours;
        occurrenceCount += 1;
      }
    }

    if (course.repeatType === 'weekly') {
      current = addWeeks(current, 1);
    } else if (course.repeatType === 'biweekly') {
      current = addWeeks(current, 2);
    } else {
      break;
    }
  }

  return { hours: totalHours, count: occurrenceCount };
}

export default function StatisticsView() {
  const { courses, holidays, exceptions } = useCalendarStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  const exceptionMap = useMemo(() => {
    const m = new Map<string, ScheduleException>();
    for (const [, list] of exceptions) {
      for (const ex of list) {
        m.set(`${ex.courseId}-${ex.originalDate}`, ex);
      }
    }
    return m;
  }, [exceptions]);

  const stats: StatisticsResult[] = useMemo(() => {
    const rangeStart = dateRange[0].startOf('month').toDate();
    const rangeEnd = dateRange[1].endOf('month').toDate();
    const map = new Map<string, StatisticsResult>();

    for (const course of courses) {
      if (course.status !== 'active') continue;
      const { hours, count } = expandCourseHours(course, rangeStart, rangeEnd, holidaySet, exceptionMap);
      if (count === 0) continue;

      const key = `${course.subject}|${course.grade}`;
      const existing = map.get(key) || {
        subject: course.subject,
        grade: course.grade,
        totalHours: 0,
        courseCount: 0,
      };
      existing.courseCount += count;
      existing.totalHours += hours;
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [courses, dateRange, holidaySet, exceptionMap]);

  const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);
  const totalCourses = stats.reduce((sum, s) => sum + s.courseCount, 0);

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '课程数', dataIndex: 'courseCount', key: 'courseCount' },
    {
      title: '总课时（小时）', dataIndex: 'totalHours', key: 'totalHours',
      render: (v: number) => v.toFixed(1),
    },
  ];

  const handleExport = () => {
    exportToExcel(stats as unknown as Record<string, unknown>[], '课时统计', `课时统计_${dateRange[0].format('YYYYMM')}`);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} align="end">
        <div>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#999' }}>统计时间范围</div>
          <RangePicker
            picker="month"
            value={dateRange}
            onChange={(v) => v && v[0] && v[1] && setDateRange([v[0], v[1]])}
          />
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="总课时（小时）" value={totalHours.toFixed(1)} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="课程总数" value={totalCourses} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="科目数" value={stats.length} /></Card>
        </Col>
      </Row>

      <Card title="课时明细">
        <Table dataSource={stats} columns={columns} rowKey={(r) => `${r.subject}-${r.grade}`} pagination={false} size="middle" />
      </Card>
    </div>
  );
}
