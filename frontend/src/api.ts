/**
 * API 调用模块
 * 封装所有与后端的通信逻辑
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * 获取设备唯一标识
 * 用于识别同一设备的用户，存储在 localStorage 中
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem('wedding_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('wedding_device_id', deviceId);
  }
  return deviceId;
}

/**
 * 通用请求函数
 * 自动添加设备标识和认证 Token
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': getDeviceId(),
    ...(options.headers as Record<string, string> || {}),
  };

  // 管理接口自动添加认证 Token
  const token = localStorage.getItem('admin_token');
  if (token && endpoint.startsWith('/api/admin') && !endpoint.includes('/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || '请求失败');
  }

  return response.json();
}

// ============ 类型定义 ============

/** 用户信息 */
export interface User {
  id: number;
  nickname: string;        // 随机昵称
  display_code: string;    // 展示码（用于领奖识别）
  total_correct: number;   // 累计答对数
  reward_balance: number;  // 可领奖励数
  reward_claimed: number;  // 已领取数
  created_at: string;
  last_active_at: string;
}

/** 题库状态 */
export interface QuestionBankStatus {
  id: number;
  name: string;
  total_questions: number;      // 总题数
  remaining_questions: number;  // 剩余题数
  available_questions: number;  // 空闲题目（未被锁定）
  active_players: number;       // 正在答题人数
}

/** 题目 */
export interface Question {
  id: number;
  question_type: 'single_choice' | 'fill_blank'; // 单选题 | 填空题
  content: string;
  options: string | null; // 选项（用 | 分隔）
}

/** 答题会话 */
export interface Session {
  id: number;
  bank_id: number;
  bank_name: string;
  questions_answered: number; // 已答题数
  questions_correct: number;  // 答对题数
  is_completed: boolean;
  created_at: string;
}

/** 获取下一题的响应 */
export interface NextQuestionResponse {
  question: Question | null;
  session_completed: boolean; // 会话是否完成
  bank_exhausted: boolean;    // 题库是否已抢光
  message: string;
}

/** 提交答案的结果 */
export interface AnswerResult {
  is_correct: boolean;
  got_reward: boolean;              // 是否获得奖励
  message: string;
  user_total_correct: number;       // 用户累计答对数
  user_reward_balance: number;      // 用户可领奖励数
  session_questions_answered: number;
  session_is_completed: boolean;
}

/** 奖励日志 */
export interface RewardLog {
  id: number;
  user_id: number;
  user_nickname: string | null;
  user_display_code: string | null;
  log_type: string;
  amount: number;
  balance_after: number;
  note: string | null;
  admin_operator: string | null;
  created_at: string;
}

/** 题目（管理后台用） */
export interface QuestionAdmin {
  id: number;
  bank_id: number;
  question_type: 'single_choice' | 'fill_blank';
  content: string;
  options: string | null;
  correct_answer: string;
  is_answered: boolean;
  answered_by_nickname: string | null;
}

/** 仪表盘统计数据 */
export interface DashboardStats {
  total_users: number;          // 总用户数
  total_answers: number;        // 总答题次数
  total_correct: number;        // 总答对次数
  total_reward_balance: number; // 待领奖励总数
  total_reward_claimed: number; // 已发奖励总数
  banks: QuestionBankStatus[];
}

// ============ API 接口 ============

export const api = {
  /** 来宾接口 */
  guest: {
    /** 初始化用户（首次访问自动创建） */
    init: () => request<User>('/api/guest/init', { method: 'POST' }),
    /** 获取当前用户信息 */
    getMe: () => request<User>('/api/guest/me'),
    /** 获取所有题库状态 */
    getBanks: () => request<QuestionBankStatus[]>('/api/guest/banks'),
    /** 开始答题会话 */
    startSession: (bankId: number) => request<Session>(`/api/guest/session/${bankId}`, { method: 'POST' }),
    /** 获取下一道题目 */
    getNextQuestion: (sessionId: number) => request<NextQuestionResponse>(`/api/guest/session/${sessionId}/next`),
    /** 提交答案 */
    submitAnswer: (sessionId: number, questionId: number, answer: string) =>
      request<AnswerResult>('/api/guest/answer', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, question_id: questionId, answer }),
      }),
    /** 获取我的奖励记录 */
    getRewards: () => request<RewardLog[]>('/api/guest/rewards'),
  },

  /** 公共展示页接口 */
  display: {
    /** 获取所有题库状态 */
    getBanks: () => request<QuestionBankStatus[]>('/api/display/banks'),
  },

  /** 管理后台接口 */
  admin: {
    /** 管理员登录 */
    login: (username: string, password: string) =>
      request<{ access_token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    /** 获取仪表盘数据 */
    getDashboard: () => request<DashboardStats>('/api/admin/dashboard'),
    /** 获取所有题库状态 */
    getBanks: () => request<QuestionBankStatus[]>('/api/admin/banks'),
    /** 获取用户列表（支持搜索） */
    getUsers: (query?: string) => request<User[]>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`),
    /** 获取用户详情 */
    getUser: (userId: number) => request<User>(`/api/admin/users/${userId}`),
    /** 获取用户奖励记录 */
    getUserRewards: (userId: number) => request<RewardLog[]>(`/api/admin/users/${userId}/rewards`),
    /** 发放奖励（扣减可领数量） */
    distributeReward: (userId: number, amount: number, note?: string) =>
      request<User>('/api/admin/reward/distribute', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, amount, note }),
      }),
    /** 增加奖励 */
    addReward: (userId: number, amount: number, note?: string) =>
      request<User>('/api/admin/reward/add', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, amount, note }),
      }),
    /** 扣减奖励 */
    deductReward: (userId: number, amount: number, note?: string) =>
      request<User>('/api/admin/reward/deduct', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, amount, note }),
      }),
    /** 获取所有奖励日志 */
    getLogs: () => request<RewardLog[]>('/api/admin/logs'),
    
    /** 获取题库下所有题目 */
    getBankQuestions: (bankId: number) => request<QuestionAdmin[]>(`/api/admin/banks/${bankId}/questions`),
    /** 创建题目 */
    createQuestion: (data: { bank_id: number; question_type: string; content: string; options?: string; correct_answer: string }) =>
      request<QuestionAdmin>('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    /** 删除题目 */
    deleteQuestion: (questionId: number) =>
      request<{ message: string }>(`/api/admin/questions/${questionId}`, { method: 'DELETE' }),
    /** 一键重置所有数据（需要密码） */
    resetAll: (password: string) => request<{ message: string }>('/api/admin/reset/all', { 
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
    /** 重置单个题库（需要密码） */
    resetBank: (bankId: number, password: string) => request<{ message: string }>(`/api/admin/reset/bank/${bankId}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
    /** 彻底重建题库（需要 admin secret） */
    rebuildAll: (adminSecret: string) => request<{ message: string }>('/api/admin/reset/rebuild', {
      method: 'POST',
      body: JSON.stringify({ admin_secret: adminSecret }),
    }),
  },
};
