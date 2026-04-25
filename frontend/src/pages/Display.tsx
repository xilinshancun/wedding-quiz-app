import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import type { QuestionBankStatus } from '../api';

export default function Display() {
  const [banks, setBanks] = useState<QuestionBankStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
    loadBanks();
    const interval = setInterval(loadBanks, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl">加载中...</div>
      </div>
    );
  }

  const bank = banks.find(b => b.name === '趣味答题') ?? banks[0];
  if (!bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl">暂无题库</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-orange-500 flex flex-col items-center justify-center p-6">
      {/* 标题区 */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-yellow-300 mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
          喜结良缘
        </h1>
        <p className="text-white/90 text-xl tracking-wider">扫码参与互动答题 · 赢取精美礼品</p>
      </div>

      {/* 二维码卡片 */}
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 mb-8 relative">
        <div className="flex flex-col items-center">
          <QRCodeSVG
            value={`${baseUrl}/bank/${bank.id}`}
            size={280}
            level="M"
            includeMargin
          />
          <p className="mt-4 text-gray-500 text-sm">打开微信扫一扫</p>
        </div>

        {bank.remaining_questions === 0 && (
          <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
            <span className="text-yellow-300 text-3xl font-bold transform -rotate-12">已抢光</span>
          </div>
        )}
      </div>

      {/* 实时统计 */}
      <div className="flex gap-6">
        <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center min-w-[120px]">
          <p className="text-3xl font-bold text-yellow-300">{bank.remaining_questions}</p>
          <p className="text-white/80 text-sm mt-1">剩余题目</p>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center min-w-[120px]">
          <p className="text-3xl font-bold text-yellow-300">{bank.active_players}</p>
          <p className="text-white/80 text-sm mt-1">正在答题</p>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center min-w-[120px]">
          <p className="text-3xl font-bold text-yellow-300">{bank.total_questions}</p>
          <p className="text-white/80 text-sm mt-1">总题数</p>
        </div>
      </div>
    </div>
  );
}
