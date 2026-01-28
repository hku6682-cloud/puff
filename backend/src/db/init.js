const db = require('./index');

const initDB = async () => {
  try {
    // Create ENUM types
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'blocked', 'suspended');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(30) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        phone_verified BOOLEAN DEFAULT FALSE,
        account_verified BOOLEAN DEFAULT FALSE,
        is_blocked BOOLEAN DEFAULT FALSE,
        block_reason VARCHAR(500),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
        CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$')
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `);

    // Create user_info table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_info (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        bio TEXT,
        profile_photo_url VARCHAR(500),
        display_name VARCHAR(100),
        verified_badge BOOLEAN DEFAULT FALSE,
        follower_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        post_count INT DEFAULT 0,
        total_likes_received INT DEFAULT 0,
        account_age_days INT DEFAULT 0,
        activity_score INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_user_info_verified_badge ON user_info(verified_badge);
      CREATE INDEX IF NOT EXISTS idx_user_info_activity_score ON user_info(activity_score);
    `);

    // Create wallet table
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        balance_coins DECIMAL(15, 2) DEFAULT 0.00,
        balance_points INT DEFAULT 0,
        total_earned DECIMAL(15, 2) DEFAULT 0.00,
        total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
        is_frozen BOOLEAN DEFAULT FALSE,
        freeze_reason VARCHAR(500),
        daily_earning_limit DECIMAL(10, 2) DEFAULT 5000.00,
        daily_earned_today DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id);
    `);

    // Create posts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        caption TEXT,
        image_url VARCHAR(500) NOT NULL,
        image_hash VARCHAR(255) UNIQUE,
        like_count INT DEFAULT 0,
        view_count INT DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        can_earn BOOLEAN DEFAULT FALSE,
        earning_amount DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT caption_length CHECK (LENGTH(caption) <= 2000)
      );
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count DESC);
    `);

    // Create likes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        post_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        UNIQUE(user_id, post_id)
      );
      CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    `);

    // Create followers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id BIGSERIAL PRIMARY KEY,
        follower_id BIGINT NOT NULL,
        following_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(follower_id, following_id),
        CONSTRAINT no_self_follow CHECK (follower_id != following_id)
      );
      CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
      CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
    `);

    // Create transactions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        type VARCHAR(50),
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id, created_at DESC);
    `);

    // Create earning_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS earning_logs (
        id BIGSERIAL PRIMARY KEY,
        post_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        like_count_at_earning INT,
        earning_amount DECIMAL(15, 2),
        status VARCHAR(50) DEFAULT 'pending',
        calculated_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_earning_logs_post_id ON earning_logs(post_id);
      CREATE INDEX IF NOT EXISTS idx_earning_logs_user_id ON earning_logs(user_id);
    `);

    // Create fraud_flags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS fraud_flags (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT,
        post_id BIGINT,
        flag_type VARCHAR(50),
        severity INT DEFAULT 50,
        reason VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_fraud_flags_user_id ON fraud_flags(user_id);
      CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);
    `);

    console.log('✅ Database initialized successfully');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    return false;
  }
};

module.exports = { initDB };
