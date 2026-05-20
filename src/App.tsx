import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Layout/Sidebar';
import MainLayout from './components/Layout/MainLayout';
import { useViewStore } from './stores/viewStore';
import { useCalendarStore } from './stores/calendarStore';
import './App.css';

function App() {
  const { loadCourses, loadHolidays } = useCalendarStore();
  const tab = useViewStore((s) => s.currentTab);
  void tab; // will be used for view switching in later tasks

  useEffect(() => {
    loadCourses();
    loadHolidays();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app-layout">
        <Sidebar />
        <MainLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            请在侧边栏选择功能模块
          </div>
        </MainLayout>
      </div>
    </ConfigProvider>
  );
}

export default App;
