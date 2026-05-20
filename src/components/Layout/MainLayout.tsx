import { useViewStore } from '../../stores/viewStore';

const titles: Record<string, string> = {
  calendar: '日历视图',
  courses: '课程管理',
  statistics: '课时统计',
  import: '导入Excel',
  settings: '设置',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentTab } = useViewStore();

  return (
    <div className="app-main">
      <div className="app-main-header">
        <h2 style={{ margin: 0, fontSize: 18 }}>{titles[currentTab]}</h2>
      </div>
      <div className="app-main-content">{children}</div>
    </div>
  );
}
