/**
 * 路由配置
 * 定义所有页面路由
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Display from './pages/Display';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminLogs from './pages/admin/Logs';
import AdminQuestions from './pages/admin/Questions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 来宾端页面 */}
        <Route path="/" element={<Welcome />} />
        <Route path="/bank/:bankId" element={<Welcome />} />
        <Route path="/quiz/:sessionId" element={<Quiz />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* 公共展示页 */}
        <Route path="/display" element={<Display />} />
        
        {/* 管理后台 */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/banks/:bankId/questions" element={<AdminQuestions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
