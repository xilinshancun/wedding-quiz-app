/**
 * 管理后台 - 题目管理
 * 
 * 功能：
 * - 查看题库下所有题目
 * - 添加新题目
 * - 删除题目
 * - 重置题库答题状态
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import type { QuestionAdmin, QuestionBankStatus } from '../../api';

export default function AdminQuestions() {
  const navigate = useNavigate();
  const { bankId } = useParams<{ bankId: string }>();
  const [bank, setBank] = useState<QuestionBankStatus | null>(null);
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 新题目表单
  const [newQuestion, setNewQuestion] = useState({
    question_type: 'single_choice' as 'single_choice' | 'fill_blank',
    content: '',
    options: '',
    correct_answer: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [navigate, bankId]);

  const loadData = async () => {
    if (!bankId) return;
    setLoading(true);
    try {
      const [banksData, questionsData] = await Promise.all([
        api.admin.getBanks(),
        api.admin.getBankQuestions(parseInt(bankId))
      ]);
      const currentBank = banksData.find(b => b.id === parseInt(bankId));
      setBank(currentBank || null);
      setQuestions(questionsData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) return;
    
    try {
      await api.admin.createQuestion({
        bank_id: parseInt(bankId),
        question_type: newQuestion.question_type,
        content: newQuestion.content,
        options: newQuestion.question_type === 'single_choice' ? newQuestion.options : undefined,
        correct_answer: newQuestion.correct_answer
      });
      setNewQuestion({ question_type: 'single_choice', content: '', options: '', correct_answer: '' });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      alert('添加失败: ' + (err as Error).message);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('确定要删除这道题目吗？')) return;
    
    try {
      await api.admin.deleteQuestion(questionId);
      loadData();
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const handleResetBank = async () => {
    if (!bankId) return;
    if (!confirm('确定要重置该题库的所有答题状态吗？这将清除所有答题记录。')) return;
    
    try {
      const result = await api.admin.resetBank(parseInt(bankId));
      alert(result.message);
      loadData();
    } catch (err) {
      alert('重置失败: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-800">← 返回</Link>
            <h1 className="text-xl font-bold text-gray-800">
              题目管理 - {bank?.name || '未知题库'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              添加题目
            </button>
            <button
              onClick={handleResetBank}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              重置题库
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 题库统计 */}
        {bank && (
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-8">
            <div>总题数: <span className="font-bold">{bank.total_questions}</span></div>
            <div>剩余题目: <span className="font-bold text-green-600">{bank.remaining_questions}</span></div>
            <div>已答对: <span className="font-bold text-blue-600">{bank.total_questions - bank.remaining_questions}</span></div>
          </div>
        )}

        {/* 添加题目表单 */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">添加新题目</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题目类型</label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as 'single_choice' | 'fill_blank' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="single_choice">单选题</option>
                  <option value="fill_blank">填空题</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题目内容</label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              
              {newQuestion.question_type === 'single_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选项（用 | 分隔，如：A. 选项1|B. 选项2|C. 选项3|D. 选项4）
                  </label>
                  <input
                    type="text"
                    value={newQuestion.options}
                    onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="A. 选项1|B. 选项2|C. 选项3|D. 选项4"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  正确答案{newQuestion.question_type === 'fill_blank' ? '（多个答案用 | 分隔）' : ''}
                </label>
                <input
                  type="text"
                  value={newQuestion.correct_answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={newQuestion.question_type === 'single_choice' ? 'A' : '答案1|答案2'}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 题目列表 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">题目内容</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">选项</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">答案</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((q) => (
                <tr key={q.id} className={q.is_answered ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3 text-gray-600">{q.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      q.question_type === 'single_choice' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {q.question_type === 'single_choice' ? '单选' : '填空'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs">
                    <div className="truncate" title={q.content}>{q.content}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm max-w-xs">
                    {q.question_type === 'single_choice' && q.options ? (
                      <div className="space-y-1">
                        {q.options.split('|').map((opt, idx) => (
                          <div key={idx} className="text-xs">{opt}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm font-medium">{q.correct_answer}</td>
                  <td className="px-4 py-3 text-center">
                    {q.is_answered ? (
                      <span className="text-green-600 text-sm">
                        已答对 {q.answered_by_nickname && `(${q.answered_by_nickname})`}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">未答</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">暂无题目</div>
          )}
        </div>
      </div>
    </div>
  );
}
