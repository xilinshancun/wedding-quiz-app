"""初始化示例数据"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import QuestionBank, Question, QuestionType

Base.metadata.create_all(bind=engine)

SAMPLE_DATA = {
    "新人故事": [
        {"type": QuestionType.SINGLE_CHOICE, "content": "新郎新娘是在哪里相识的？", "options": "A. 大学|B. 公司|C. 朋友介绍|D. 网络", "answer": "B"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "新郎第一次约会请新娘吃的是什么？", "options": "A. 火锅|B. 西餐|C. 日料|D. 烧烤", "answer": "A"},
        {"type": QuestionType.FILL_BLANK, "content": "新郎的生日是几月几日？（格式：X月X日）", "answer": "3月15日|三月十五日|3.15"},
        {"type": QuestionType.FILL_BLANK, "content": "新娘最喜欢的花是什么？", "answer": "玫瑰|玫瑰花"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "新人恋爱多久后结婚的？", "options": "A. 1年|B. 2年|C. 3年|D. 5年", "answer": "C"},
        {"type": QuestionType.FILL_BLANK, "content": "新郎向新娘求婚的地点是？", "answer": "海边|三亚"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "新娘最喜欢新郎的哪一点？", "options": "A. 帅气|B. 幽默|C. 体贴|D. 会做饭", "answer": "C"},
        {"type": QuestionType.FILL_BLANK, "content": "新人的结婚纪念日是哪一天？", "answer": "今天|2026年3月7日"},
    ],
    "猜灯谜": [
        {"type": QuestionType.FILL_BLANK, "content": "一块变九块（打一成语）", "answer": "四分五裂"},
        {"type": QuestionType.FILL_BLANK, "content": "千里相逢（打一字）", "answer": "重"},
        {"type": QuestionType.FILL_BLANK, "content": "七仙女嫁出去一个（打一成语）", "answer": "六神无主"},
        {"type": QuestionType.FILL_BLANK, "content": "一口咬掉牛尾巴（打一字）", "answer": "告"},
        {"type": QuestionType.FILL_BLANK, "content": "两人力大冲破天（打一字）", "answer": "夫"},
        {"type": QuestionType.FILL_BLANK, "content": "上下一体（打一字）", "answer": "卡"},
        {"type": QuestionType.FILL_BLANK, "content": "另有变动（打一字）", "answer": "加"},
        {"type": QuestionType.FILL_BLANK, "content": "有心得志（打一字）", "answer": "士"},
        {"type": QuestionType.FILL_BLANK, "content": "半推半就（打一字）", "answer": "掠"},
        {"type": QuestionType.FILL_BLANK, "content": "人不在其位（打一字）", "answer": "立"},
    ],
    "婚礼知识": [
        {"type": QuestionType.SINGLE_CHOICE, "content": "中国传统婚礼中，新娘穿什么颜色的礼服？", "options": "A. 白色|B. 红色|C. 粉色|D. 金色", "answer": "B"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "西方婚礼中，新娘通常穿什么颜色？", "options": "A. 白色|B. 红色|C. 蓝色|D. 绿色", "answer": "A"},
        {"type": QuestionType.FILL_BLANK, "content": "中国传统婚礼中，新人要喝什么酒？", "answer": "交杯酒|合卺酒"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "婚礼上抛花束的传统来自哪个国家？", "options": "A. 中国|B. 法国|C. 英国|D. 美国", "answer": "C"},
        {"type": QuestionType.FILL_BLANK, "content": "中国传统婚礼中，新娘头上戴的叫什么？", "answer": "凤冠|盖头"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "结婚纪念日中，银婚是多少周年？", "options": "A. 10年|B. 15年|C. 20年|D. 25年", "answer": "D"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "金婚是结婚多少周年？", "options": "A. 30年|B. 40年|C. 50年|D. 60年", "answer": "C"},
        {"type": QuestionType.FILL_BLANK, "content": "婚礼上新郎新娘互换的信物通常是什么？", "answer": "戒指|婚戒|结婚戒指"},
    ],
    "趣味问答": [
        {"type": QuestionType.SINGLE_CHOICE, "content": "爱情的化学物质是什么？", "options": "A. 多巴胺|B. 肾上腺素|C. 血清素|D. 以上都是", "answer": "D"},
        {"type": QuestionType.FILL_BLANK, "content": "情人节是几月几日？", "answer": "2月14日|二月十四日|2.14"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "七夕节是农历几月初几？", "options": "A. 七月初七|B. 八月十五|C. 正月十五|D. 五月初五", "answer": "A"},
        {"type": QuestionType.FILL_BLANK, "content": "牛郎织女一年见几次面？", "answer": "1次|一次|1"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "玫瑰花语中，99朵玫瑰代表什么？", "options": "A. 我爱你|B. 天长地久|C. 一生一世|D. 永远爱你", "answer": "B"},
        {"type": QuestionType.FILL_BLANK, "content": "520代表什么意思？", "answer": "我爱你"},
        {"type": QuestionType.SINGLE_CHOICE, "content": "1314代表什么？", "options": "A. 一生一世|B. 生生世世|C. 永永远远|D. 长长久久", "answer": "A"},
        {"type": QuestionType.FILL_BLANK, "content": "白头偕老的下一句是什么？", "answer": "永结同心|百年好合"},
    ],
}


def init_data():
    db = SessionLocal()
    try:
        existing = db.query(QuestionBank).first()
        if existing:
            print("数据库已有数据，跳过初始化")
            return
        
        for bank_name, questions in SAMPLE_DATA.items():
            bank = QuestionBank(name=bank_name, description=f"{bank_name}题库")
            db.add(bank)
            db.flush()
            
            for q in questions:
                question = Question(
                    bank_id=bank.id,
                    question_type=q["type"],
                    content=q["content"],
                    options=q.get("options"),
                    correct_answer=q["answer"]
                )
                db.add(question)
            
            print(f"创建题库: {bank_name}, 题目数: {len(questions)}")
        
        db.commit()
        print("示例数据初始化完成！")
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
