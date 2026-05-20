import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  ImportOutlined,
  SettingOutlined,
} from '@ant-design/icons';
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
  const { currentTab, setTab } = useViewStore();

  return (
    <div className="app-sidebar">
      <div className="app-sidebar-header">教师日程系统</div>
      <div className="app-sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`app-sidebar-item ${currentTab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
