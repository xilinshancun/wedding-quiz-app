/**
 * 答题页面
 * 
 * 功能：
 * - 显示当前题目（单选题或填空题）
 * - 显示答题进度（第 X/3 题）
 * - 提交答案后显示结果
 * - 答对显示奖励动画
 * - 完成 3 题或题库抢光后显示结束页面
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Question, AnswerResult, User } from '../api';

/** 页面状态 */
type QuizState = 'loading' | 'question' | 'result' | 'completed' | 'exhausted';

export default function Quiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<QuizState>('loading');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);

  useEffect(() => {
    loadUser();
    loadNextQuestion();
  }, [sessionId]);

  /** 加载用户信息 */
  const loadUser = async () => {
    try {
      const userData = await api.guest.getMe();
      setUser(userData);
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  };

  /** 加载下一道题目 */
  const loadNextQuestion = async () => {
    if (!sessionId) return;
    
    setState('loading');
    try {
      const response = await api.guest.getNextQuestion(parseInt(sessionId));
      setMessage(response.message);
      
      if (response.session_completed) {
        // 会话完成：正常完成或题库抢光
        setState(response.bank_exhausted ? 'exhausted' : 'completed');
      } else if (response.question) {
        // 有新题目
        setQuestion(response.question);
        setSelectedOption('');
        setFillAnswer('');
        setState('question');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '加载题目失败');
      setState('completed');
    }
  };

  /** 提交答案 */
  const handleSubmit = async () => {
    if (!sessionId || !question) return;
    
    const answer = question.question_type === 'single_choice' ? selectedOption : fillAnswer.trim();
    if (!answer) {
      setMessage('请输入答案');
      return;
    }

    setSubmitting(true);
    try {
      const answerResult = await api.guest.submitAnswer(
        parseInt(sessionId),
        question.id,
        answer
      );
      setResult(answerResult);
      // 更新用户数据
      setUser(prev => prev ? {
        ...prev,
        total_correct: answerResult.user_total_correct,
        reward_balance: answerResult.user_reward_balance,
      } : null);
      setQuestionNumber(answerResult.session_questions_answered);
      setState('result');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  /** 继续下一题 */
  const handleNext = () => {
    if (result?.session_is_completed) {
      setState('completed');
    } else {
      setQuestionNumber(prev => prev + 1);
      loadNextQuestion();
    }
  };

  /** 解析选项字符串 */
  const parseOptions = (optionsStr: string | null): string[] => {
    if (!optionsStr) return [];
    return optionsStr.split('|');
  };

  // 加载中状态
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wedding-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-wedding-red">加载中...</p>
        </div>
      </div>
    );
  }

  // 完成或题库抢光状态
  if (state === 'completed' || state === 'exhausted') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="wedding-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {state === 'exhausted' ? '😅' : '🎉'}
          </div>
          <h2 className="wedding-title text-2xl text-wedding-red mb-4">
            {state === 'exhausted' ? '题目已抢光' : '本轮答题完成'}
          </h2>
          <p className="text-gray-600 mb-6">
            {state === 'exhausted' 
              ? '当前题库题目已被其他来宾抢光，请稍后再试或扫描其他题库二维码！'
              : '恭喜完成本轮答题！可以重新扫码继续参与哦~'
            }
          </p>
          
          {/* 统计数据 */}
          {user && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-wedding-cream rounded-lg p-4">
                <p className="text-3xl font-bold text-wedding-red">{user.total_correct}</p>
                <p className="text-sm text-gray-500">累计答对</p>
              </div>
              <div className="bg-wedding-cream rounded-lg p-4">
                <p className="text-3xl font-bold text-wedding-gold">{user.reward_balance}</p>
                <p className="text-sm text-gray-500">可领奖励</p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <button onClick={() => navigate('/')} className="wedding-btn w-full">
              返回首页
            </button>
            <button 
              onClick={() => navigate('/profile')} 
              className="w-full py-3 text-wedding-red underline"
            >
              查看我的奖励
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 答题结果状态
  if (state === 'result' && result) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="wedding-card p-8 max-w-md w-full text-center">
          <div className={`text-6xl mb-4 ${result.is_correct ? 'float-animation' : ''}`}>
            {result.is_correct ? '🎊' : '😢'}
          </div>
          <h2 className={`wedding-title text-3xl mb-2 ${result.is_correct ? 'text-wedding-red' : 'text-gray-500'}`}>
            {result.is_correct ? '答对啦！' : '答错了'}
          </h2>
          <p className="text-gray-600 mb-6">{result.message}</p>
          
          {/* 获得奖励提示 */}
          {result.got_reward && (
            <div className="bg-wedding-gold/10 border border-wedding-gold rounded-lg p-4 mb-6 pulse-glow">
              <p className="text-wedding-gold font-bold">+1 奖励</p>
            </div>
          )}
          
          {/* 统计数据 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-wedding-cream rounded-lg p-3">
              <p className="text-2xl font-bold text-wedding-red">{result.user_total_correct}</p>
              <p className="text-xs text-gray-500">累计答对</p>
            </div>
            <div className="bg-wedding-cream rounded-lg p-3">
              <p className="text-2xl font-bold text-wedding-gold">{result.user_reward_balance}</p>
              <p className="text-xs text-gray-500">可领奖励</p>
            </div>
          </div>
          
          <button onClick={handleNext} className="wedding-btn w-full">
            {result.session_is_completed ? '查看结果' : '下一题'}
          </button>
        </div>
      </div>
    );
  }

  // 答题状态
  return (
    <div className="min-h-screen p-4">
      <div className="flower-decoration flower-top-left" />
      <div className="flower-decoration flower-bottom-right" />
      
      <div className="max-w-md mx-auto pt-4">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500">
            ← 返回
          </button>
          <div className="bg-wedding-red text-white px-4 py-1 rounded-full text-sm">
            第 {questionNumber}/3 题
          </div>
          {user && (
            <div className="text-sm text-wedding-gold">
              奖励: {user.reward_balance}
            </div>
          )}
        </div>

        {/* 题目卡片 */}
        {question && (
          <div className="wedding-card p-6">
            {/* 题目类型标签 */}
            <div className="mb-2 text-center">
              <span className="inline-block bg-wedding-pink text-wedding-red px-3 py-1 rounded-full text-sm">
                {question.question_type === 'single_choice' ? '单选题' : '填空题'}
              </span>
            </div>
            
            {/* 题目内容 */}
            <h2 className="text-xl text-center mb-6 leading-relaxed">
              {question.content}
            </h2>

            {/* 单选题选项 */}
            {question.question_type === 'single_choice' ? (
              <div className="space-y-3 mb-6">
                {parseOptions(question.options).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(option.charAt(0))}
                    className={`option-btn ${selectedOption === option.charAt(0) ? 'selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              /* 填空题输入框 */
              <div className="mb-6">
                <input
                  type="text"
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="请输入答案"
                  className="w-full px-4 py-4 border-2 border-wedding-pink rounded-xl text-center text-lg focus:border-wedding-red focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* 错误提示 */}
            {message && (
              <p className="text-center text-red-500 text-sm mb-4">{message}</p>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={submitting || (question.question_type === 'single_choice' ? !selectedOption : !fillAnswer.trim())}
              className="wedding-btn w-full"
            >
              {submitting ? '提交中...' : '提交答案'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
