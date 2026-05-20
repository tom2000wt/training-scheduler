import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  ImportOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useViewStore } from '../../stores/viewStore';
import type { SidebarTab } from '../../types';

const menuItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: 'calendar', label: '日历视图', icon: <CalendarOutlined /> },
  { key: 'courses', label: '课程管理', icon: <BookOutlined /> },
  { key: 'statistics', label: '课时统计', icon: <BarChartOutlined /> },
  { key: 'import', label: '导入Excel', icon: <ImportOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> },
];

export default function Sidebar() {
  const { currentTab, setTab, sidebarCollapsed } = useViewStore();

  return (
    <div className={`app-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="app-sidebar-header">
        {sidebarCollapsed ? '南' : '南老师的课程管理系统'}
      </div>
      <div className="app-sidebar-menu">
        {menuItems.map((item) => (
          <Tooltip key={item.key} title={sidebarCollapsed ? item.label : ''} placement="right">
            <div
              className={`app-sidebar-item ${currentTab === item.key ? 'active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.icon}
              <span className="app-sidebar-label">{item.label}</span>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
