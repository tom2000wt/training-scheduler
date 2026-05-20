import { Modal, Form, Input, Select, TimePicker, DatePicker, ColorPicker } from 'antd';
import dayjs from 'dayjs';
import type { Course } from '../../types';

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

interface Props {
  open: boolean;
  course?: Course | null;
  onSave: (course: Course) => Promise<void>;
  onCancel: () => void;
}

export default function CourseForm({ open, course, onSave, onCancel }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    const data: Course = {
      ...course,
      subject: values.subject,
      grade: values.grade || '',
      className: values.className || '',
      classroom: values.classroom || '',
      startTime: values.time?.[0]?.format('HH:mm') || '08:00',
      endTime: values.time?.[1]?.format('HH:mm') || '10:00',
      repeatType: values.repeatType || 'none',
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD') || '',
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
      color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff',
      status: 'active',
      notes: values.notes || '',
    };
    await onSave(data);
    form.resetFields();
  };

  const initialValues = course
    ? {
        subject: course.subject,
        grade: course.grade,
        className: course.className,
        classroom: course.classroom,
        time: [dayjs(course.startTime, 'HH:mm'), dayjs(course.endTime, 'HH:mm')],
        repeatType: course.repeatType,
        dateRange: course.startDate
          ? [dayjs(course.startDate), course.endDate ? dayjs(course.endDate) : undefined]
          : undefined,
        color: course.color,
        notes: course.notes,
      }
    : {};

  return (
    <Modal
      title={course ? '编辑课程' : '新增课程'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="subject" label="科目" rules={[{ required: true, message: '请输入科目' }]}>
          <Input placeholder="如：数学" />
        </Form.Item>
        <Form.Item name="grade" label="年级">
          <Input placeholder="如：初三" />
        </Form.Item>
        <Form.Item name="className" label="班级">
          <Input placeholder="如：A班" />
        </Form.Item>
        <Form.Item name="classroom" label="教室">
          <Input placeholder="如：302" />
        </Form.Item>
        <Form.Item name="time" label="上课时间" rules={[{ required: true }]}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="repeatType" label="重复类型">
          <Select
            options={[
              { value: 'none', label: '不重复（单次）' },
              { value: 'weekly', label: '每周重复' },
              { value: 'biweekly', label: '每两周重复' },
            ]}
          />
        </Form.Item>
        <Form.Item name="dateRange" label="起止日期">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="color" label="颜色标记">
          <ColorPicker presets={[{ label: '推荐', colors: COLORS }]} />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
