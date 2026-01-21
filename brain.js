export const Brain = {
    questionPool: [
        "这个颜色，让你想起了哪段温柔的旧时光？",
        "如果你现在正站在星云的中心，你会听到什么样的呼吸声？",
        "这里的起伏，是否映射了你最近在自我成长中的某次跨越？",
        "这种朦胧感带给你的，是想要探索的冲动，还是平静的安放？",
        "如果这一粒粒光斑是你的潜意识，你觉得它们现在在诉说什么？"
    ],
    getRandomQuestions() {
        // 随机洗牌并抽取 3 个问题
        return this.questionPool.sort(() => Math.random() - 0.5).slice(0, 3);
    }
};
