import { useState } from 'react';
import { Card, Button, Table, Alert, Space, Radio, message } from 'antd';
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { api } from '../../api';
import { exportTemplate } from '../../utils/excelExport';
import type { ImportPreview } from '../../types';

export default function ImportExcel() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [loading, setLoading] = useState(false);

  const handleSelectFile = async () => {
    const selected = await open({
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      multiple: false,
    });
    if (selected) {
      setFilePath(selected as string);
      try {
        const result = await api.previewExcelImport(selected as string);
        setPreview(result);
      } catch (e) {
        message.error(String(e));
      }
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const count = await api.executeExcelImport(filePath, mode);
      message.success(`成功导入 ${count} 条课程`);
      setPreview(null);
      setFilePath('');
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '时间', key: 'time', render: (_: unknown, r: { startTime: string; endTime: string }) => `${r.startTime}-${r.endTime}` },
    { title: '重复', dataIndex: 'repeatType', key: 'repeatType' },
    { title: '日期', dataIndex: 'startDate', key: 'startDate' },
  ];

  return (
    <div>
      <Card title="导入课表" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <div style={{ marginBottom: 16, color: '#999' }}>
            支持导入 .xlsx / .xls 格式课表文件<br />
            表头格式：科目 | 年级 | 班级 | 教室 | 开始时间 | 结束时间 | 重复类型 | 开始日期 | 结束日期 | 备注
          </div>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleSelectFile} size="large">
            选择Excel文件
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportTemplate} size="large" style={{ marginLeft: 12 }}>
            下载导入模板
          </Button>
        </div>

        {preview && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>导入模式：</span>
                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
                  <Radio.Button value="append">追加导入</Radio.Button>
                  <Radio.Button value="replace">替换导入（覆盖现有课表）</Radio.Button>
                </Radio.Group>
              </Space>
            </div>

            {preview.conflicts.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="检测到冲突"
                description={
                  <ul style={{ margin: 0 }}>
                    {preview.conflicts.map((c, i) => (
                      <li key={i}>{c.description}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <Table
              dataSource={preview.courses}
              columns={columns}
              rowKey={(_, i) => String(i)}
              pagination={false}
              size="small"
              scroll={{ y: 240 }}
              style={{ marginBottom: 16 }}
            />

            <Button type="primary" onClick={handleImport} loading={loading}>
              确认导入 ({preview.courses.length} 条)
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
