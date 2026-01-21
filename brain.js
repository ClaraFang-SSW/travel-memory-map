export const Brain = {
    // 第一阶段：客观坐标
    objectiveSteps: [
        "这段记忆，发生在世界的哪一个角落？",
        "那是哪一年的时光？或者说，正值什么季节？"
    ],
    // 第二阶段：感性打捞
    questionPool: [
        "在这个坐标下，当时的空气是什么味道的？",
        "这里的色彩起伏，是否映射了你那段旅程中某次心境的波动？",
        "如果重新走入这片星云，你想对当时的自己说句什么？",
        "这种朦胧感带给你的，是探索的冲动，还是平静的安放？"
    ],
    getRandomQuestions() {
        return this.questionPool.sort(() => Math.random() - 0.5).slice(0, 2);
    }
};
