"""
FastAPI 应用入口

婚礼现场互动答题系统后端服务
"""
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import get_settings
from .database import engine, Base, SessionLocal
from .routers import router as guest_router
from .routers.admin import router as admin_router
from .routers.display import router as display_router
from .models import QuestionBank, Question, QuestionType, SessionAnswer, QuizSession, User, RewardLog

settings = get_settings()
logger = logging.getLogger(__name__)

QUIZ_QUESTIONS = [
    {"content": "阜阳话里的"马猴子"通常用来吓唬小孩，它指的是？", "options": "A. 猴子|B. 狼/怪物|C. 蝉", "answer": "B"},
    {"content": ""秫秫（shú shú）"在阜阳农田里很常见，它是指？", "options": "A. 玉米|B. 高粱|C. 小麦", "answer": "B"},
    {"content": "妈妈说"去把那'条帚'拿来"，她是让你拿什么？", "options": "A. 抹布|B. 扫帚|C. 簸箕", "answer": "B"},
    {"content": "阜阳人说的"（hán）"其实是指？", "options": "A. 糖|B. 醋|C. 盐", "answer": "C"},
    {"content": "阜阳话里的"老鸹（guā）"是指哪种鸟？", "options": "A. 喜鹊|B. 乌鸦|C. 麻雀", "answer": "B"},
    {"content": ""（ké ma）"在池塘里跳来跳去，它是？", "options": "A. 蚂蚁|B. 青蛙|C. 蜻蜓", "answer": "B"},
    {"content": ""这小孩'火气'真大"，这里的"火气"是指？", "options": "A. 脾气|B. 胆量|C. 身体热量", "answer": "B"},
    {"content": "阜阳话里称呼"外祖父"通常叫什么？", "options": "A. 爷爷|B. 姥爷|C. 外公", "answer": "B"},
    {"content": "阜阳人说的"汤"在晚上通常特指？", "options": "A. 鸡汤|B. 稀饭/面汤|C. 菜汤", "answer": "B"},
    {"content": ""别在那'咕捣'了"，这里的"咕捣"是指？", "options": "A. 睡觉|B. 乱动|C. 说话", "answer": "B"},
    {"content": "阜阳话里的"ráng"，形容人时是指？", "options": "A. 厉害|B. 软弱/不行|C. 聪明", "answer": "B"},
    {"content": ""这衣服'草'了"，这里的"草"是指？", "options": "A. 脏了|B. 皱了|C. 破了", "answer": "B"},
    {"content": ""你会'feí'）吗？"，在河边，这话的意思是？", "options": "A. 喝水|B. 游泳|C. 潜水", "answer": "B"},
    {"content": ""把门'yǎn'上"，意思是？", "options": "A. 锁门|B. 关上但不锁|C. 踢门", "answer": "B"},
    {"content": ""我不'待见'他"，意思是？", "options": "A. 见不到|B. 不喜欢|C. 没时间见", "answer": "B"},
    {"content": "形容一个人长得"排场"，是指他？", "options": "A. 讲究|B. 体面/好看|C. 浪费", "answer": "B"},
    {"content": ""这天'jiāo'干的"，形容的是？", "options": "A. 湿润|B. 非常干燥|C. 炎热", "answer": "B"},
    {"content": ""白委我恁近"，意思是指？", "options": "A. 别挤我|B. 别靠我这么近|C. 走远点", "answer": "B"},
    {"content": "这小孩真会"拿捻"人，这里的"拿捻"意为？", "options": "A. 安排|B. 笑话|C. 恶心", "answer": "C"},
    {"content": ""这人办事真'利落'"，意为？", "options": "A. 慢|B. 干脆/快|C. 啰嗦", "answer": "B"},
    {"content": ""你咋'绝（jue）'人呢？"，这里的"绝"是指？", "options": "A. 骂|B. 打|C. 推", "answer": "A"},
    {"content": ""你别'quo'我"，这里的"虚"是指？", "options": "A. 骗|B. 吓唬|C. 夸奖", "answer": "B"},
    {"content": ""这东西'精'（jīng）贵"，是指？", "options": "A. 便宜|B. 昂贵/稀缺|C. 好看", "answer": "B"},
    {"content": ""半吊子"在阜阳话里常用来形容什么样的人？", "options": "A. 很有钱|B. 办事不牢靠/缺根筋|C. 聪明", "answer": "B"},
    {"content": ""弄啥（shá）咧？"，这句话最常用的语境是？", "options": "A. 告别|B. 询问在做什么|C. 吃饭", "answer": "B"},
    {"content": ""这事真'硌（gè）'应人"，这里的"硌应"是指？", "options": "A. 舒服|B. 让人不舒服/讨厌|C. 高兴", "answer": "B"},
    {"content": ""看你那'熊（xióng）'样"，这里的"熊"通常带有？", "options": "A. 赞美|B. 调侃/轻蔑|C. 害怕", "answer": "B"},
    {"content": ""你可'拉（lā）'倒吧"，这句话的意思是？", "options": "A. 让你去拉车|B. 算了/别提了|C. 摔倒了", "answer": "B"},
    {"content": ""搁（gé）这儿"，意思是什么？", "options": "A. 放在这里|B. 在这里|C. 离开这里", "answer": "B"},
    {"content": ""别跟我作假"，意思是？", "options": "A. 别客气|B. 跟给我假期|C. 我要请假", "answer": "A"},
    {"content": ""这人'心眼（yǎn）'真多"，意为？", "options": "A. 心脏有问题|B. 聪明/爱算计|C. 善良", "answer": "B"},
    {"content": ""你'邪（xié）'活啥哩？"，意思是？", "options": "A. 你病了吗|B. 你瞎嚷嚷什么|C. 你真厉害", "answer": "B"},
    {"content": "昨天俺大蛉子筑哩瓠子馍好吃哩很，问:这里"大蛉子"是指？", "options": "A. 姐姐|B. 姨妈|C. 舅妈", "answer": "C"},
    {"content": ""椰熊"是什么意思？", "options": "A. 熊的种类|B. 椰子|C. 坏了完蛋了", "answer": "C"},
    {"content": "白哭了，再哽唧批脸乎你，问:这个"批脸乎"的正确意思？", "options": "A. 打耳刮子|B. 在脸上画画|C. 摸脸", "answer": "A"},
    {"content": "不是我佛，你真隔念人，问:"隔念"人的正确意思？", "options": "A. 烦人讨厌人|B. 招人喜欢|C. 天真活泼", "answer": "A"},
    {"content": "你可能白叠啦了，问:这个"叠啦"的正确意思是什么？", "options": "A. 父亲|B. 撒娇|C. 叠衣服", "answer": "B"},
    {"content": "你个憨熊，叫你白弄，你非要弄，问:"憨熊"是什么意思？", "options": "A. 骂人的话|B. 一种动物|C. 夸人的话", "answer": "A"},
    {"content": "马上筑饭了，白慌走类也，问:这个"白慌"是什么意思？", "options": "A. 不要急|B. 快点走|C. 走的好看点", "answer": "A"},
    {"content": "地上都是匪，你白蹚匪过去，问:这个"匪"是什么意思？", "options": "A. 水|B. 韭菜|C. 土匪", "answer": "A"},
    {"content": "法治社会，小半拉决子别找事！问:这个"半拉决子"是什么意思？", "options": "A. 小男孩|B. 小女孩|C. 拉车大爷", "answer": "A"},
    {"content": "白走了，晚上斗两杯，乖乖，那不带劲哩羊熊样，问:"带劲"是什么意思？", "options": "A. 一身全是劲|B. 有劲没处用|C. 好舒服", "answer": "C"},
    {"content": "你出鳖子款，就搁家能吊台，问:这里"出鳖子款"是什么意思？", "options": "A. 甲鱼|B. 流行的款式|C. 怯懦、胆小", "answer": "C"},
    {"content": "格拉条的"格拉"是什么意思？", "options": "A. 搅拌|B. 品牌名|C. 地名", "answer": "A"},
    {"content": ""麻烦稍微咧一下，我想看看这个文物"，这句话中的"咧"是什么意思？", "options": "A. 排队|B. 东西裂开|C. 让一让", "answer": "C"},
    {"content": "你家的当门真大，阜阳话中"当门"是什么意思？", "options": "A. 大门|B. 客厅|C. 食堂", "answer": "B"},
    {"content": ""大娘，隔家剥落生呢!"其中"落生"是什么意思？", "options": "A. 花生|B. 化石|C. 玉米", "answer": "A"},
    {"content": "天歇了会亮起绿色的灯光，"天歇了"是什么意思？", "options": "A. 天天想休息|B. 天太冷了|C. 天黑了", "answer": "C"},
    {"content": "这里有个不冷谷子，"不冷谷子"是什么意思？", "options": "A. 拨浪鼓|B. 一种粮食|C. 凉面条", "answer": "A"},
    {"content": "你这小孩咋嫩费嘴，"嫩费嘴"是什么意思？", "options": "A. 爱顶嘴、犟嘴|B. 白费口舌|C. 话多，爱唠叨", "answer": "B"},
]


def init_sample_data() -> None:
    """仅在数据库为空时初始化趣味答题题库"""
    db = SessionLocal()
    try:
        existing = db.query(QuestionBank).first()
        if existing:
            logger.info("数据库已有数据，跳过初始化")
            return

        bank = QuestionBank(name="趣味答题", description="阜阳方言趣味答题")
        db.add(bank)
        db.flush()

        for q in QUIZ_QUESTIONS:
            question = Question(
                bank_id=bank.id,
                question_type=QuestionType.SINGLE_CHOICE,
                content=q["content"],
                options=q["options"],
                correct_answer=q["answer"],
            )
            db.add(question)

        db.commit()
        logger.info(f"趣味答题题库初始化完成，共 {len(QUIZ_QUESTIONS)} 题")
    except Exception as e:
        logger.error(f"初始化数据失败: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：创建表和初始化数据
    logger.info("正在初始化数据库...")
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建完成")
    
    init_sample_data()
    
    yield
    
    # 关闭时的清理工作（如果需要）
    logger.info("应用关闭")


app = FastAPI(
    title="婚礼答题系统",
    description="婚礼现场互动答题 H5 系统 API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# 配置 CORS，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(guest_router)
app.include_router(admin_router)
app.include_router(display_router)


@app.get("/health")
def health_check():
    """健康检查接口"""
    return {"status": "ok"}


# ============ 静态文件托管（生产环境） ============
# 前端 build 后的文件放在 backend/static 目录
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # 托管静态资源（JS/CSS/图片等）
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        SPA 路由回退
        
        所有非 API 请求都返回 index.html，由前端路由处理
        """
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
