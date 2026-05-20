import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useViewStore } from '../../stores/viewStore';

const titles: Record<string, string> = {
  calendar: '日历视图',
  courses: '课程管理',
  statistics: '课时统计',
  import: '导入Excel',
  settings: '设置',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentTab, sidebarCollapsed, toggleSidebar } = useViewStore();

  return (
    <div className="app-main">
      <div className="app-main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />
          <h2 style={{ margin: 0, fontSize: 18 }}>{titles[currentTab]}</h2>
        </div>
      </div>
      <div className="app-main-content">{children}</div>
    </div>
  );
}
