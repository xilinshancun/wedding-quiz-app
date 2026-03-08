/**
 * 公共展示页
 * 
 * 功能：
 * - 以灯笼形式展示所有题库
 * - 每个题库显示二维码、剩余题数、答题人数
 * - 每 5 秒自动刷新数据
 * - 题库抢光时显示"已抢光"标记
 * 
 * 适合现场投屏或平板展示
 */
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import type { QuestionBankStatus } from '../api';

export default function Display() {
  const [banks, setBanks] = useState<QuestionBankStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // 获取当前页面的基础 URL，用于生成二维码
    const url = window.location.origin;
    setBaseUrl(url);
    
    // 初始加载
    loadBanks();
    // 每 5 秒刷新一次
    const interval = setInterval(loadBanks, 5000);
    return () => clearInterval(interval);
  }, []);

  /** 加载题库状态 */
  const loadBanks = async () => {
    try {
      const data = await api.display.getBanks();
      setBanks(data);
    } catch (err) {
      console.error('加载题库状态失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 p-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="wedding-title text-5xl text-yellow-300 mb-2">
          喜结良缘
        </h1>
        <p className="text-white/80 text-xl">扫码参与互动答题 赢取精美礼品</p>
      </div>

      {/* 题库灯笼网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {banks.map((bank) => (
          <div key={bank.id} className="relative">
            <div className="lantern-container">
              {/* 灯笼主体 */}
              <div className="bg-gradient-to-b from-red-500 to-red-700 rounded-t-full rounded-b-3xl p-6 shadow-2xl border-4 border-yellow-500">
                {/* 灯笼顶部装饰 */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-4 bg-yellow-500 rounded-t-lg" />
                  <div className="w-2 h-6 bg-yellow-600 mx-auto" />
                </div>
                
                {/* 题库名称 */}
                <div className="text-center mb-4">
                  <h2 className="wedding-title text-2xl text-yellow-300">{bank.name}</h2>
                </div>
                
                {/* 二维码 */}
                <div className="bg-white rounded-xl p-3 mb-4">
                  <QRCodeSVG
                    value={`${baseUrl}/bank/${bank.id}`}
                    size={140}
                    level="M"
                    className="mx-auto"
                  />
                </div>
                
                {/* 统计数据 */}
                <div className="text-center text-white space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>剩余题目</span>
                    <span className="font-bold text-yellow-300">
                      {bank.remaining_questions}/{bank.total_questions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>剩余空闲</span>
                    <span className="font-bold text-yellow-300">
                      {bank.available_questions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>正在答题</span>
                    <span className="font-bold text-yellow-300">{bank.active_players} 人</span>
                  </div>
                </div>
                
                {/* 已抢光遮罩 */}
                {bank.remaining_questions === 0 && (
                  <div className="absolute inset-0 bg-black/50 rounded-t-full rounded-b-3xl flex items-center justify-center">
                    <span className="text-yellow-300 text-xl font-bold transform -rotate-12">
                      已抢光
                    </span>
                  </div>
                )}
              </div>
              
              {/* 灯笼底部流苏 */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-yellow-600" />
              </div>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-12 bg-red-400 rounded-b-full" style={{
                    height: `${40 + Math.random() * 20}px`
                  }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="text-center mt-8 text-white/60 text-sm">
        页面每 5 秒自动刷新
      </div>
    </div>
  );
}
