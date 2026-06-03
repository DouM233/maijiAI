const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  let connection;
  try {
    // 连接 MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✅ 成功连接到 MySQL 服务器\n');

    // 创建数据库
    console.log('📦 创建数据库...');
    await connection.query(CREATE DATABASE IF NOT EXISTS  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci);
    console.log(✅ 数据库  创建成功\n);

    // 切换到目标数据库
    await connection.query(USE );

    // 创建用户表
    console.log('👥 创建用户表...');
    await connection.query(
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        dingtalk_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        email VARCHAR(100),
        avatar_url TEXT,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_dingtalk_id (dingtalk_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    );
    console.log('✅ 用户表创建成功\n');

    // 创建工具表
    console.log('🛠️ 创建工具表...');
    await connection.query(
      CREATE TABLE IF NOT EXISTS tools (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        url VARCHAR(500),
        icon VARCHAR(50),
        category VARCHAR(50),
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    );
    console.log('✅ 工具表创建成功\n');

    // 创建访问日志表
    console.log('📝 创建访问日志表...');
    await connection.query(
      CREATE TABLE IF NOT EXISTS access_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(36),
        tool_id VARCHAR(50),
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_tool_id (tool_id),
        INDEX idx_accessed_at (accessed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    );
    console.log('✅ 访问日志表创建成功\n');

    // 插入默认工具数据
    console.log('📋 插入默认工具数据...');
    const defaultTools = [
      { id: 'buyer-show', name: '麦吉AI买家秀生成器', description: '一键生成专业买家秀图片', url: 'https://maijiai.coze.site/', icon: '📸', category: '电商', status: 'active', sort_order: 1 },
      { id: 'promo-image', name: '麦吉AI推广图生成器', description: '快速制作营销推广图', url: 'https://vision-loop.coze.site/', icon: '🎨', category: '电商', status: 'active', sort_order: 2 },
      { id: 'gif-processor', name: '麦吉AI GIF处理器', description: '在线GIF动图编辑和优化', url: 'https://maijigif.coze.site/', icon: '✨', category: '设计', status: 'active', sort_order: 3 },
      { id: 'personal-interviewer', name: '个人访谈官', description: 'AI辅助的个人访谈和简历优化', url: '', icon: '🎙️', category: '管理', status: 'pending', sort_order: 4 },
      { id: 'ecommerce-consultant', name: '电商管理落地顾问', description: '电商运营策略和落地执行指导', url: '', icon: '💼', category: '管理', status: 'pending', sort_order: 5 },
      { id: 'viral-growth-coach', name: '爆款裂变分析AI教练', description: '分析爆款裂变策略，提供增长建议', url: '', icon: '📈', category: '电商', status: 'pending', sort_order: 6 },
      { id: 'tmall-competition', name: '天猫竞争策略教练', description: '天猫平台竞争分析和策略制定', url: '', icon: '🎯', category: '电商', status: 'pending', sort_order: 7 },
      { id: 'redbook-ads', name: '小红书千帆投放专家', description: '小红书广告投放优化和效果分析', url: '', icon: '📕', category: '电商', status: 'pending', sort_order: 8 },
      { id: 'short-video-script', name: '短视频脚本生成', description: 'AI生成吸引人的短视频脚本', url: '', icon: '🎬', category: '设计', status: 'pending', sort_order: 9 }
    ];

    for (const tool of defaultTools) {
      await connection.query(
        INSERT INTO tools (id, name, description, url, icon, category, status, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), url = VALUES(url), icon = VALUES(icon), category = VALUES(category), status = VALUES(status), sort_order = VALUES(sort_order)
      , [tool.id, tool.name, tool.description, tool.url, tool.icon, tool.category, tool.status, tool.sort_order]);
    }
    console.log('✅ 默认工具数据插入成功\n');

    console.log('🎉 数据库初始化完成！');
    console.log('\n📊 数据库统计:');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [toolCount] = await connection.query('SELECT COUNT(*) as count FROM tools');
    console.log(  - 用户数: );
    console.log(  - 工具数: );

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
