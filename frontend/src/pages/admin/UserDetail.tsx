/**
 * 管理后台 - 用户详情
 * 
 * 功能：
 * - 显示用户详细信息
 * - 发放奖励（扣减可领数量）
 * - 增加奖励
 * - 扣减奖励
 * - 显示奖励变动记录
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import type { User, RewardLog } from '../../api';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<RewardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [operating, setOperating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadUser();
  }, [userId, navigate]);

  /** 加载用户信息 */
  const loadUser = async () => {
    if (!userId) return;
    try {
      const [userData, logsData] = await Promise.all([
        api.admin.getUser(parseInt(userId)),
        api.admin.getUserRewards(parseInt(userId)),
      ]);
      setUser(userData);
      setLogs(logsData);
    } catch (err) {
      console.error('加载用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /** 发放奖励 */
  const handleDistribute = async () => {
    if (!userId || amount <= 0) return;
    setOperating(true);
    setMessage('');
    try {
      const updated = await api.admin.distributeReward(parseInt(userId), amount, note || undefined);
      setUser(updated);
      setMessage('发奖成功！');
      loadUser();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    } finally {
      setOperating(false);
    }
  };

  /** 增加奖励 */
  const handleAdd = async () => {
    if (!userId || amount <= 0) return;
    setOperating(true);
    setMessage('');
    try {
      const updated = await api.admin.addReward(parseInt(userId), amount, note || undefined);
      setUser(updated);
      setMessage('增加成功！');
      loadUser();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    } finally {
      setOperating(false);
    }
  };

  /** 扣减奖励 */
  const handleDeduct = async () => {
    if (!userId || amount <= 0) return;
    setOperating(true);
    setMessage('');
    try {
      const updated = await api.admin.deductReward(parseInt(userId), amount, note || undefined);
      setUser(updated);
      setMessage('扣减成功！');
      loadUser();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    } finally {
      setOperating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">用户不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin/users" className="text-gray-600 hover:text-gray-800">← 返回</Link>
          <h1 className="text-xl font-bold text-gray-800">用户详情</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
              <p className="text-blue-600 font-mono">{user.display_code}</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{user.total_correct}</p>
              <p className="text-gray-500">累计答对</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{user.reward_balance}</p>
              <p className="text-gray-500">可领奖励</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{user.reward_claimed}</p>
              <p className="text-gray-500">已领取</p>
            </div>
          </div>

          {/* 奖励操作 */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-800 mb-4">奖励操作</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm text-gray-500 mb-1">数量</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">备注（可选）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="操作备注..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDistribute}
                disabled={operating || user.reward_balance < amount}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                发放奖励
              </button>
              <button
                onClick={handleAdd}
                disabled={operating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                增加奖励
              </button>
              <button
                onClick={handleDeduct}
                disabled={operating}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                扣减奖励
              </button>
            </div>
            {/* 操作结果提示 */}
            {message && (
              <p className={`mt-3 ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* 奖励记录 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">奖励记录</h3>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无记录</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{getLogTypeText(log.log_type)}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                      {log.admin_operator && ` · 操作员: ${log.admin_operator}`}
                    </p>
                    {log.note && <p className="text-sm text-gray-500">{log.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      log.log_type === 'admin_distribute' || log.log_type === 'admin_deduct' 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {log.log_type === 'admin_distribute' || log.log_type === 'admin_deduct' ? '-' : '+'}
                      {Math.abs(log.amount)}
                    </p>
                    <p className="text-sm text-gray-400">余额: {log.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
