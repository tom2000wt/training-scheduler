import { Modal, Descriptions, Button, Space, Popconfirm, message } from 'antd';
import type { Course } from '../../types';
import { useCalendarStore } from '../../stores/calendarStore';
import { useState } from 'react';
import CourseForm from './CourseForm';
import ExceptionForm from './ExceptionForm';

interface Props {
  course: Course | null;
  open: boolean;
  onClose: () => void;
}

export default function CourseDetail({ course, open, onClose }: Props) {
  const { removeCourse, updateCourse, addException } = useCalendarStore();
  const [editing, setEditing] = useState(false);
  const [showException, setShowException] = useState(false);

  if (!course) return null;

  const handleDelete = async () => {
    if (course.id != null) {
      await removeCourse(course.id);
      message.success('课程已删除');
      onClose();
    }
  };

  const handleSave = async (updated: Course) => {
    await updateCourse(updated);
    message.success('课程已更新');
    setEditing(false);
  };

  return (
    <>
      <Modal
        title="课程详情"
        open={open && !editing}
        onCancel={onClose}
        footer={
          <Space>
            <Button onClick={() => setShowException(true)}>调课/停课</Button>
            <Button onClick={() => setEditing(true)}>编辑</Button>
            <Popconfirm title="确定删除此课程？" onConfirm={handleDelete}>
              <Button danger>删除</Button>
            </Popconfirm>
            <Button onClick={onClose}>关闭</Button>
          </Space>
        }
        width={480}
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="科目">{course.subject}</Descriptions.Item>
          <Descriptions.Item label="年级">{course.grade || '-'}</Descriptions.Item>
          <Descriptions.Item label="班级">{course.className || '-'}</Descriptions.Item>
          <Descriptions.Item label="教室">{course.classroom || '-'}</Descriptions.Item>
          <Descriptions.Item label="时间">{course.startTime} - {course.endTime}</Descriptions.Item>
          <Descriptions.Item label="重复">{course.repeatType === 'weekly' ? '每周' : course.repeatType === 'biweekly' ? '每两周' : '不重复'}</Descriptions.Item>
          <Descriptions.Item label="起止">{course.startDate} {course.endDate ? `~ ${course.endDate}` : '起'}</Descriptions.Item>
          <Descriptions.Item label="备注">{course.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <CourseForm
        open={editing}
        course={course}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />

      <ExceptionForm
        open={showException}
        courseId={course.id!}
        courseDate={course.startDate}
        startTime={course.startTime}
        endTime={course.endTime}
        onSave={async (ex) => { await addException(ex); message.success('已记录'); setShowException(false); }}
        onCancel={() => setShowException(false)}
      />
    </>
  );
}
