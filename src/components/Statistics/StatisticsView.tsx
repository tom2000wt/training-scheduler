import { useState, useMemo } from 'react';
import { Card, DatePicker, Table, Button, Space, Statistic, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import { calculateHours } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelExport';
import type { StatisticsResult } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function StatisticsView() {
  const { courses } = useCalendarStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const stats: StatisticsResult[] = useMemo(() => {
    const map = new Map<string, StatisticsResult>();

    for (const course of courses) {
      if (course.status !== 'active') continue;
      const key = `${course.subject}|${course.grade}`;
      const existing = map.get(key) || {
        subject: course.subject,
        grade: course.grade,
        totalHours: 0,
        courseCount: 0,
      };
      existing.courseCount += 1;
      existing.totalHours += calculateHours(course.startTime, course.endTime);
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [courses, dateRange]);

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
