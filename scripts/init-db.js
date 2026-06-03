const mysql = require('mysql2/promise');

async function initDatabase() {
  console.log('开始初始化数据库...');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'rm-bp1i000kgs39a1688.mysql.rds.aliyuncs.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'DouM233',
      password: process.env.DB_PASSWORD || 'Zsmjmaijiai888'
    });

    console.log('已连接 MySQL');

    await connection.query('CREATE DATABASE IF NOT EXISTS maijiai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('数据库 maijiai 就绪');

    await connection.query('USE maijiai');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        dingtalk_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        avatar_url TEXT,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_dingtalk_id (dingtalk_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('users 表就绪');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        url VARCHAR(500) DEFAULT '',
        icon VARCHAR(50) DEFAULT '',
        category VARCHAR(50) DEFAULT '',
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('tools 表就绪');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(36),
        tool_id VARCHAR(50),
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        INDEX idx_user_id (user_id),
        INDEX idx_tool_id (tool_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('access_logs 表就绪');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(200) DEFAULT '',
        agent_id VARCHAR(100) DEFAULT '',
        model VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('conversations 表就绪');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        conversation_id VARCHAR(36) NOT NULL,
        role ENUM('system', 'user', 'assistant') NOT NULL,
        content MEDIUMTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('messages 表就绪');

    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [toolCount] = await connection.query('SELECT COUNT(*) as count FROM tools');
    console.log('用户数:', userCount[0].count, '工具数:', toolCount[0].count);
    console.log('数据库初始化完成!');

  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
