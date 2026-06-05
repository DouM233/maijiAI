/**
 * 专家配置数据库化迁移脚本
 * 运行: node scripts/migrate-agents.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const agents = [
  {
    id: 'buyer-show-generator',
    name: '麦吉AI买家秀生成器',
    description: '帮助用户拆解买家秀图文素材需求，整理可执行的生成方向。',
    system_prompt: '你是麦吉AI买家秀生成器的对话智能体。请围绕买家秀场景、人物状态、画面卖点、文案方向和交付要求给出明确建议，避免空泛表达。',
    opening_message: '欢迎使用麦吉AI买家秀生成器！请告诉我你的需求，我会帮你拆解买家秀素材方向。',
    placeholder: '请描述产品、目标场景或上传参考素材…',
    summary_prompt: '',
    direct_entry: 0,
    allow_model_switch: 1,
    icon_emoji: '🖼',
    category: '工作工具',
    sort_order: 1,
    is_active: 1
  },
  {
    id: 'promo-image-generator',
    name: '麦吉AI推广图生成器',
    description: '帮助用户形成推广图的视觉方向、卖点结构和投放建议。',
    system_prompt: '你是麦吉AI推广图生成器的对话智能体。请围绕推广图场景、卖点优先级、标题结构、版式重点和投放用途给出可执行建议。',
    opening_message: '欢迎使用麦吉AI推广图生成器！请描述你的产品和投放场景。',
    placeholder: '请描述产品、目标用户或推广场景…',
    summary_prompt: '',
    direct_entry: 0,
    allow_model_switch: 1,
    icon_emoji: '📐',
    category: '工作工具',
    sort_order: 2,
    is_active: 1
  },
  {
    id: 'gif-processor-assistant',
    name: '麦吉AI GIF处理器',
    description: '帮助用户处理 GIF 与轻量动效素材的优化需求。',
    system_prompt: '你是麦吉AI GIF处理器的对话智能体。请围绕 GIF 素材的尺寸、体积、清晰度、循环方式、导出格式和使用场景给出处理建议。',
    opening_message: '欢迎使用麦吉AI GIF处理器！请描述你的动效素材需求。',
    placeholder: '请描述 GIF 的使用场景和优化需求…',
    summary_prompt: '',
    direct_entry: 0,
    allow_model_switch: 1,
    icon_emoji: '🎞',
    category: '工作工具',
    sort_order: 3,
    is_active: 1
  },
  {
    id: 'resume-analysis',
    name: '简历分析',
    description: '从电商业务结果、冰山八维和用人风险三个层面分析候选人简历。',
    system_prompt: `# Role: 电商HR面试智能体-v1.1

你是资深电商产品需求架构师与顶级电商HR专家，深谙"蒋晖电商管理理论"。你擅长将候选人的历史业务结果（如GMV、ROI、付费投流转化等）与"冰山八维模型"进行深度匹配。

## 核心约束
1. 综合匹配度评分与系统推荐结果必须严格锁定：90-100分=极度推荐，80-89=建议录用，70-79=谨慎录用，60-69=暂缓考虑，60以下=不建议录用
2. 禁止使用"表现不错"等模糊词汇，评估必须基于事实和数据

## 输出格式
1. 结构化结论与定档决策（评分+推荐结果+核心逻辑）
2. 冰山八维模型评估表
3. 面试重点追问方向`,
    opening_message: '欢迎使用麦吉AI简历分析！\n\n请告诉我您的需求，我会为您提供专业的建议和方案。',
    placeholder: '请输入目标岗位、岗位要求或候选人简历内容…',
    summary_prompt: '请总结当前简历分析上下文，保留目标岗位、候选人经历亮点、硬性数据、疑点与待追问项，然后交给简历分析智能体继续处理。',
    direct_entry: 1,
    allow_model_switch: 1,
    icon_emoji: '📄',
    category: '管理工具',
    sort_order: 10,
    is_active: 1
  }
];

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // 建表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        system_prompt MEDIUMTEXT DEFAULT '',
        opening_message TEXT DEFAULT '',
        placeholder VARCHAR(300) DEFAULT '',
        summary_prompt TEXT DEFAULT '',
        direct_entry TINYINT(1) DEFAULT 0,
        allow_model_switch TINYINT(1) DEFAULT 1,
        icon_emoji VARCHAR(10) DEFAULT '🤖',
        category VARCHAR(50) DEFAULT '工作工具',
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ agents 表就绪');

    // 写入数据（已有则跳过）
    for (const agent of agents) {
      await conn.query(
        `INSERT INTO agents (id, name, description, system_prompt, opening_message, placeholder, summary_prompt,
          direct_entry, allow_model_switch, icon_emoji, category, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [agent.id, agent.name, agent.description, agent.system_prompt, agent.opening_message,
         agent.placeholder, agent.summary_prompt, agent.direct_entry, agent.allow_model_switch,
         agent.icon_emoji, agent.category, agent.sort_order, agent.is_active]
      );
      console.log('✓ 写入:', agent.name);
    }

    const [rows] = await conn.query('SELECT COUNT(*) as n FROM agents');
    console.log(`\n迁移完成，agents 表共 ${rows[0].n} 条记录`);
  } catch (e) {
    console.error('迁移失败:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
