export const Brain = {
    // 已经填好你的 Key
    SUPABASE_URL: 'https://qxzjxtrvlynozvbjhcog.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4emp4dHJ2bHlub3p2YmpoY29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Nzk2MTYsImV4cCI6MjA4NDU1NTYxNn0.dq14U-jRXdPq-KAB2076g6Ap6ps1zCYp1JhKZ-FI1zQ',

    // 动态问题库
    questionPool: [
        "这个颜色，让你想起了哪段温柔的旧时光？",
        "如果你现在正站在星云的中心，你会听到什么样的呼吸声？",
        "这里的起伏，是否映射了你最近在自我成长中的某次跨越？",
        "这种朦胧感带给你的，是想要探索的冲动，还是平静的安放？"
    ],

    getRandomQuestions() {
        return this.pool = this.questionPool.sort(() => Math.random() - 0.5).slice(0, 3);
    }
};
