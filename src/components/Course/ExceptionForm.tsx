import { Modal, Form, Input, Select, DatePicker, TimePicker } from 'antd';
import type { ScheduleException } from '../../types';

interface Props {
  open: boolean;
  courseId: number;
  courseDate: string;
  startTime: string;
  endTime: string;
  onSave: (exception: ScheduleException) => Promise<void>;
  onCancel: () => void;
}

export default function ExceptionForm({ open, courseId, courseDate, onSave, onCancel }: Props) {
  const [form] = Form.useForm();
  const exceptionType = Form.useWatch('exceptionType', form);

  const handleOk = async () => {
    const values = await form.validateFields();
    const exception: ScheduleException = {
      courseId,
      originalDate: courseDate,
      exceptionType: values.exceptionType || 'cancelled',
      reason: values.reason || '',
    };

    if (values.exceptionType === 'rescheduled') {
      exception.newDate = values.newDate?.format('YYYY-MM-DD');
      exception.newStartTime = values.newTime?.[0]?.format('HH:mm');
      exception.newEndTime = values.newTime?.[1]?.format('HH:mm');
    }

    await onSave(exception);
    form.resetFields();
  };

  return (
    <Modal title="调课/停课" open={open} onOk={handleOk} onCancel={onCancel} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ exceptionType: 'cancelled' }}>
        <Form.Item name="exceptionType" label="类型">
          <Select
            options={[
              { value: 'cancelled', label: '停课' },
              { value: 'rescheduled', label: '调课' },
            ]}
          />
        </Form.Item>

        {exceptionType === 'rescheduled' && (
          <>
            <Form.Item name="newDate" label="新日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="newTime" label="新时间">
              <TimePicker.RangePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item name="reason" label="原因">
          <Input.TextArea rows={2} placeholder="调课或停课的原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
