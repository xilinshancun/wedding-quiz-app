/**
 * 管理后台 - 操作日志
 * 
 * 功能：
 * - 显示所有奖励操作日志
 * - 包含时间、类型、数量、操作员、备注
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api';
import type { RewardLog } from '../../api';

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<RewardLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadLogs();
  }, [navigate]);

  /** 加载日志 */
  const loadLogs = async () => {
    try {
      const data = await api.admin.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('加载日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /** 获取日志类型的中文描述 */
  const getLogTypeText = (type: string) => {
    switch (type) {
      case 'answer_correct': return '答题奖励';
      case 'admin_distribute': return '领取奖励';
      case 'admin_add': return '管理员增加';
      case 'admin_deduct': return '管理员扣减';
      default: return type;
    }
  };

  /** 获取日志类型的样式 */
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'answer_correct': return 'bg-green-100 text-green-800';
      case 'admin_distribute': return 'bg-blue-100 text-blue-800';
      case 'admin_add': return 'bg-purple-100 text-purple-800';
      case 'admin_deduct': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-800">← 返回</Link>
          <h1 className="text-xl font-bold text-gray-800">操作日志</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">数量</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">余额</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作员</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${getLogTypeColor(log.log_type)}`}>
                        {getLogTypeText(log.log_type)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${
                      log.log_type === 'admin_distribute' || log.log_type === 'admin_deduct'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {log.log_type === 'admin_distribute' || log.log_type === 'admin_deduct' ? '-' : '+'}
                      {Math.abs(log.amount)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{log.balance_after}</td>
                    <td className="px-4 py-3 text-gray-600">{log.admin_operator || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{log.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无日志</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
