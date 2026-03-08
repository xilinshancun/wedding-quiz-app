/**
 * 管理后台 - 用户列表
 * 
 * 功能：
 * - 显示用户列表（昵称、识别码、答对数、奖励数）
 * - 支持按昵称或识别码搜索
 * - 点击进入用户详情页
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import type { User } from '../../api';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadUsers();
    
    // 自动刷新（每 5 秒）
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadUsers(search || undefined);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [navigate, autoRefresh, search]);

  /** 加载用户列表 */
  const loadUsers = async (query?: string) => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers(query);
      setUsers(data);
    } catch (err) {
      console.error('加载用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /** 处理搜索 */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-800">← 返回</Link>
            <h1 className="text-xl font-bold text-gray-800">用户管理</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索昵称或识别码..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            搜索
          </button>
          <button 
            type="button" 
            onClick={() => { setSearch(''); loadUsers(); }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            重置
          </button>
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg ${autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}
          </button>
        </form>

        {/* 用户列表 */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">昵称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">识别码</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">答对数</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">可领奖励</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">已领取</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{user.nickname}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {user.display_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{user.total_correct}</td>
                    <td className="px-4 py-3 text-center text-yellow-600 font-medium">{user.reward_balance}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{user.reward_claimed}</td>
                    <td className="px-4 py-3 text-center">
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        管理
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无用户</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
