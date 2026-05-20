import { useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import type { Course } from '../../types';
import CourseForm from './CourseForm';
import CourseDetail from './CourseDetail';

export default function CourseList() {
  const { courses, addCourse, updateCourse, removeCourse } = useCalendarStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '时间', key: 'time', render: (_: unknown, r: Course) => `${r.startTime}-${r.endTime}` },
    {
      title: '重复', dataIndex: 'repeatType', key: 'repeatType',
      render: (v: string) => {
        const labels: Record<string, string> = { weekly: '每周', biweekly: '每两周', none: '单次' };
        return <Tag>{labels[v] || v}</Tag>;
      },
    },
    {
      title: '日期', key: 'date',
      render: (_: unknown, r: Course) => `${r.startDate}${r.endDate ? ` ~ ${r.endDate}` : '起'}`,
    },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, r: Course) => (
        <Space>
          <a onClick={() => setDetailCourse(r)}>详情</a>
          <a onClick={() => { setEditingCourse(r); setFormOpen(true); }}>编辑</a>
          <Popconfirm title="确定删除此课程？" onConfirm={async () => {
            if (r.id != null) {
              await removeCourse(r.id);
              message.success('课程已删除');
            }
          }}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCourse(null);
            setFormOpen(true);
          }}
        >
          新增课程
        </Button>
      </div>
      <Table
        dataSource={courses}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="middle"
        scroll={{ y: 'calc(100vh - 280px)' }}
      />

      <CourseForm
        open={formOpen}
        course={editingCourse}
        onSave={async (course) => {
          if (course.id) {
            await updateCourse(course);
          } else {
            await addCourse(course);
          }
          setFormOpen(false);
          setEditingCourse(null);
        }}
        onCancel={() => { setFormOpen(false); setEditingCourse(null); }}
      />

      <CourseDetail
        course={detailCourse}
        open={!!detailCourse}
        onClose={() => setDetailCourse(null)}
      />
    </div>
  );
}
