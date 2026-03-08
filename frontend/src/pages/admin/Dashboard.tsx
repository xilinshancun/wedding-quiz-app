/**
 * 管理后台 - 仪表盘
 * 
 * 功能：
 * - 显示总体统计数据（用户数、答题数、奖励数等）
 * - 显示各题库状态
 * - 每 10 秒自动刷新
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import type { DashboardStats } from '../../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadStats();
    // 每 10 秒刷新一次
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  /** 加载统计数据 */
  const loadStats = async () => {
    try {
      const data = await api.admin.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('加载统计数据失败:', err);
      // 认证失败时跳转到登录页
      if ((err as Error).message.includes('认证')) {
        localStorage.removeItem('admin_token');
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  /** 退出登录 */
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  /** 一键重置所有数据 */
  const handleResetAll = async () => {
    if (!confirm('确定要重置所有答题数据吗？\n\n这将清除：\n- 所有题目的答题状态\n- 所有用户的答题统计和奖励\n- 所有答题记录和奖励日志\n\n此操作不可恢复！')) return;
    if (!confirm('再次确认：真的要重置吗？')) return;
    
    try {
      const result = await api.admin.resetAll();
      alert(result.message);
      loadStats();
    } catch (err) {
      alert('重置失败: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">婚礼答题管理后台</h1>
          <div className="flex items-center gap-4">
            <Link to="/admin/users" className="text-blue-600 hover:underline">用户管理</Link>
            <Link to="/admin/logs" className="text-blue-600 hover:underline">操作日志</Link>
            <button onClick={handleResetAll} className="text-yellow-600 hover:underline">一键重置</button>
            <button onClick={handleLogout} className="text-red-600 hover:underline">退出</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <>
            {/* 总体统计 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow">
                <p className="text-3xl font-bold text-blue-600">{stats.total_users}</p>
                <p className="text-gray-500">总参与人数</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <p className="text-3xl font-bold text-green-600">{stats.total_answers}</p>
                <p className="text-gray-500">总答题次数</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <p className="text-3xl font-bold text-purple-600">{stats.total_correct}</p>
                <p className="text-gray-500">总答对次数</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <p className="text-3xl font-bold text-yellow-600">{stats.total_reward_balance}</p>
                <p className="text-gray-500">待领奖励</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <p className="text-3xl font-bold text-red-600">{stats.total_reward_claimed}</p>
                <p className="text-gray-500">已发奖励</p>
              </div>
            </div>

            {/* 题库状态 */}
            <h2 className="text-xl font-bold text-gray-800 mb-4">题库状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.banks.map((bank) => (
                <div key={bank.id} className="bg-white rounded-xl p-6 shadow">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">{bank.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">总题数</span>
                      <span className="font-medium">{bank.total_questions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">剩余题数</span>
                      <span className={`font-medium ${bank.remaining_questions < 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {bank.remaining_questions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">答题人数</span>
                      <span className="font-medium text-blue-600">{bank.active_players}</span>
                    </div>
                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${bank.remaining_questions === 0 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${(bank.remaining_questions / bank.total_questions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* 已抢光标记 */}
                  {bank.remaining_questions === 0 && (
                    <div className="mt-3 bg-red-100 text-red-600 text-center py-1 rounded text-sm">
                      已抢光
                    </div>
                  )}
                  {/* 管理按钮 */}
                  <div className="mt-3">
                    <Link 
                      to={`/admin/banks/${bank.id}/questions`}
                      className="block text-center bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
                    >
                      管理题目
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
