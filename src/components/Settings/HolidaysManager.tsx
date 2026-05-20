import { useState } from 'react';
import { Card, Calendar, List, Button, Popconfirm, DatePicker, Input, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import dayjs from 'dayjs';

export default function HolidaysManager() {
  const { holidays, addHoliday, removeHoliday } = useCalendarStore();
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [label, setLabel] = useState('');

  const handleAdd = async () => {
    if (!date) return;
    await addHoliday({ date: date.format('YYYY-MM-DD'), label });
    setDate(null);
    setLabel('');
    message.success('已添加停课日');
  };

  const holidaySet = new Set(holidays.map((h) => h.date));

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <Card title="设置停课日" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker
            value={date}
            onChange={setDate}
            style={{ width: '100%' }}
            placeholder="选择停课日期"
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="说明（如：国庆假期）"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
            添加停课日
          </Button>
        </Space>

        <List
          style={{ marginTop: 16 }}
          size="small"
          dataSource={holidays}
          renderItem={(h) => (
            <List.Item
              actions={[
                <Popconfirm title="确定移除？" onConfirm={() => h.id != null && removeHoliday(h.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>,
              ]}
            >
              <span>{h.date}</span>
              <span style={{ marginLeft: 12, color: '#999' }}>{h.label}</span>
            </List.Item>
          )}
        />
      </Card>

      <Card title="停课日预览" style={{ flex: 1 }}>
        <Calendar
          fullscreen={false}
          dateCellRender={(date) => {
            const key = date.format('YYYY-MM-DD');
            if (holidaySet.has(key)) {
              const h = holidays.find((x) => x.date === key);
              return <div style={{ color: '#ff4d4f', fontSize: 12 }}>{h?.label || '停课'}</div>;
            }
            return null;
          }}
        />
      </Card>
    </div>
  );
}
