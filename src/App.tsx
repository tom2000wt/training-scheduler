import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Layout/Sidebar';
import MainLayout from './components/Layout/MainLayout';
import CalendarView from './components/Calendar/CalendarView';
import { useViewStore } from './stores/viewStore';
import { useCalendarStore } from './stores/calendarStore';
import './App.css';

function renderContent(tab: string) {
  switch (tab) {
    case 'calendar': return <CalendarView />;
    default: return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
        请在侧边栏选择功能模块
      </div>
    );
  }
}

function App() {
  const { loadCourses, loadHolidays } = useCalendarStore();
  const tab = useViewStore((s) => s.currentTab);

  useEffect(() => {
    loadCourses();
    loadHolidays();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app-layout">
        <Sidebar />
        <MainLayout>{renderContent(tab)}</MainLayout>
      </div>
    </ConfigProvider>
  );
}

export default App;
