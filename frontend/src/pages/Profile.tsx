/**
 * 个人奖励页面
 * 
 * 功能：
 * - 显示用户信息和识别码（用于领奖）
 * - 显示累计答对数、可领奖励、已领取数
 * - 显示奖励变动记录
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { User, RewardLog } from '../api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<RewardLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [userData, logsData] = await Promise.all([
          api.guest.getMe(),
          api.guest.getRewards(),
        ]);
        setUser(userData);
        setLogs(logsData);
      } catch (err) {
        console.error('加载个人信息失败:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  /** 获取日志类型的颜色 */
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'answer_correct': return 'text-green-600';
      case 'admin_distribute': return 'text-blue-600';
      case 'admin_add': return 'text-green-600';
      case 'admin_deduct': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-wedding-red text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto pt-4">
        {/* 顶部导航 */}
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500">
            ← 返回
          </button>
          <h1 className="flex-1 text-center wedding-title text-2xl text-wedding-red">
            我的奖励
          </h1>
          <div className="w-10" />
        </div>

        {user && (
          <>
            {/* 用户信息卡片 */}
            <div className="wedding-card p-6 mb-6 text-center">
              <div className="w-20 h-20 bg-wedding-pink rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h2 className="text-xl font-semibold text-wedding-red mb-1">{user.nickname}</h2>
              <p className="text-sm text-gray-500 mb-4">识别码: {user.display_code}</p>
              
              {/* 领奖识别码（突出显示） */}
              <div className="bg-wedding-cream rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">领奖时请出示此识别码</p>
                <p className="text-3xl font-bold text-wedding-red">{user.display_code}</p>
              </div>
              
              {/* 统计数据 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-wedding-pink">
                  <p className="text-2xl font-bold text-wedding-red">{user.total_correct}</p>
                  <p className="text-xs text-gray-500">累计答对</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-wedding-gold">
                  <p className="text-2xl font-bold text-wedding-gold">{user.reward_balance}</p>
                  <p className="text-xs text-gray-500">可领奖励</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-2xl font-bold text-gray-600">{user.reward_claimed}</p>
                  <p className="text-xs text-gray-500">已领取</p>
                </div>
              </div>
            </div>

            {/* 奖励记录 */}
            <div className="wedding-card p-4">
              <h3 className="font-semibold text-gray-700 mb-4">奖励记录</h3>
              {logs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无记录</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className={`font-medium ${getLogTypeColor(log.log_type)}`}>
                          {getLogTypeText(log.log_type)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString('zh-CN')}
                        </p>
                        {log.note && (
                          <p className="text-xs text-gray-500">{log.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${log.amount > 0 && log.log_type !== 'admin_distribute' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.log_type === 'admin_distribute' ? '-' : log.amount > 0 ? '+' : ''}{Math.abs(log.amount)}
                        </p>
                        <p className="text-xs text-gray-400">余额: {log.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
