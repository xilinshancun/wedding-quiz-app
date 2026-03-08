/**
 * 来宾首页 / 题库入口页
 * 
 * 功能：
 * - 显示用户信息（昵称、答对数、奖励数）
 * - 通过 /bank/:bankId 进入时显示指定题库
 * - 否则显示所有题库列表供选择
 * - 点击开始进入答题页面
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { User, QuestionBankStatus } from '../api';

export default function Welcome() {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [bank, setBank] = useState<QuestionBankStatus | null>(null);
  const [banks, setBanks] = useState<QuestionBankStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // 初始化：获取用户信息和题库列表
  useEffect(() => {
    async function init() {
      try {
        console.log('开始初始化...');
        const [userData, banksData] = await Promise.all([
          api.guest.init(),
          api.guest.getBanks(),
        ]);
        console.log('用户数据:', userData);
        console.log('题库数据:', banksData);
        setUser(userData);
        setBanks(banksData);
        
        // 如果通过题库二维码进入，定位到对应题库
        if (bankId) {
          const currentBank = banksData.find(b => b.id === parseInt(bankId));
          setBank(currentBank || null);
        }
      } catch (err) {
        console.error('初始化失败:', err);
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bankId]);

  // 开始答题
  const handleStart = async (selectedBankId: number) => {
    setStarting(true);
    try {
      const session = await api.guest.startSession(selectedBankId);
      navigate(`/quiz/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '开始答题失败');
      setStarting(false);
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
      {/* 装饰背景 */}
      <div className="flower-decoration flower-top-left" />
      <div className="flower-decoration flower-bottom-right" />
      
      <div className="max-w-md mx-auto pt-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="wedding-title text-4xl text-wedding-red mb-2">
            喜结良缘
          </h1>
          <p className="text-gray-600">欢迎参与婚礼互动答题</p>
        </div>

        {/* 用户信息卡片 */}
        {user && (
          <div className="wedding-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">您的昵称</p>
                <p className="text-lg font-semibold text-wedding-red">{user.nickname}</p>
              </div>
              <div 
                className="bg-wedding-pink px-3 py-1 rounded-full cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <span className="text-sm text-wedding-red">{user.display_code}</span>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-wedding-cream rounded-lg p-3">
                <p className="text-2xl font-bold text-wedding-red">{user.total_correct}</p>
                <p className="text-xs text-gray-500">累计答对</p>
              </div>
              <div className="bg-wedding-cream rounded-lg p-3">
                <p className="text-2xl font-bold text-wedding-gold">{user.reward_balance}</p>
                <p className="text-xs text-gray-500">可领奖励</p>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* 题库入口 - 指定题库模式 */}
        {bank ? (
          <div className="wedding-card p-6 mb-6">
            <div className="text-center mb-4">
              <div className="inline-block bg-wedding-red text-white px-4 py-2 rounded-full mb-3">
                {bank.name}
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">剩余题目：</span>
                  <span className="text-wedding-red font-bold">{bank.remaining_questions}</span>
                  <span className="text-gray-400">/{bank.total_questions}</span>
                </div>
                <div>
                  <span className="text-gray-500">正在答题：</span>
                  <span className="text-wedding-gold font-bold">{bank.active_players}</span>
                  <span className="text-gray-400">人</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleStart(bank.id)}
              disabled={starting || bank.remaining_questions === 0}
              className="wedding-btn w-full"
            >
              {starting ? '正在进入...' : bank.remaining_questions === 0 ? '题目已抢光' : '开始答题'}
            </button>
          </div>
        ) : (
          /* 题库列表模式 */
          <div className="space-y-4">
            <h2 className="text-center text-gray-600 mb-4">选择题库开始答题</h2>
            {banks.map((b) => (
              <div key={b.id} className="wedding-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-wedding-red">{b.name}</h3>
                    <p className="text-sm text-gray-500">
                      剩余 {b.remaining_questions}/{b.total_questions} 题 · {b.active_players} 人答题中
                    </p>
                  </div>
                  <button
                    onClick={() => handleStart(b.id)}
                    disabled={starting || b.remaining_questions === 0}
                    className="wedding-btn text-sm px-4 py-2"
                  >
                    {b.remaining_questions === 0 ? '已抢光' : '开始'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部链接 */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/profile')}
            className="text-wedding-red underline text-sm"
          >
            查看我的奖励
          </button>
        </div>
      </div>
    </div>
  );
}
