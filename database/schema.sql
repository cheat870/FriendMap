-- ============================================================
-- FRIENDMAP Database Schema
-- MySQL 8.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS friendmap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE friendmap;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  avatar_url    VARCHAR(500) NULL,
  bio           TEXT         NULL,
  role          ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
  status        ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  email_verified TINYINT(1)  NOT NULL DEFAULT 0,
  last_active_at DATETIME    NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_status (status),
  INDEX idx_users_role (role),
  INDEX idx_users_last_active (last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USER SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)  NOT NULL,
  token_hash    VARCHAR(255) NOT NULL,
  device_info   VARCHAR(500) NULL,
  ip_address    VARCHAR(45)  NULL,
  expires_at    DATETIME     NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. FRIEND REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  sender_id     VARCHAR(36)  NOT NULL,
  receiver_id   VARCHAR(36)  NOT NULL,
  status        ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  message       VARCHAR(255) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_friend_request (sender_id, receiver_id),
  INDEX idx_fr_sender (sender_id),
  INDEX idx_fr_receiver (receiver_id),
  INDEX idx_fr_status (status),
  CONSTRAINT fk_fr_sender   FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id_1     VARCHAR(36)  NOT NULL,
  user_id_2     VARCHAR(36)  NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_friendship (user_id_1, user_id_2),
  INDEX idx_fs_user1 (user_id_1),
  INDEX idx_fs_user2 (user_id_2),
  CONSTRAINT fk_fs_user1 FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fs_user2 FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_friendship_order CHECK (user_id_1 < user_id_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. BLOCKED USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  blocker_id    VARCHAR(36)  NOT NULL,
  blocked_id    VARCHAR(36)  NOT NULL,
  reason        VARCHAR(255) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_block (blocker_id, blocked_id),
  INDEX idx_block_blocker (blocker_id),
  INDEX idx_block_blocked (blocked_id),
  CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. LOCATIONS (current)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id            VARCHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)     NOT NULL,
  latitude      DECIMAL(10,8)   NOT NULL,
  longitude     DECIMAL(11,8)   NOT NULL,
  accuracy      FLOAT           NULL COMMENT 'GPS accuracy in meters',
  altitude      FLOAT           NULL,
  heading       FLOAT           NULL COMMENT 'Direction 0-360',
  speed         FLOAT           NULL COMMENT 'Speed in m/s',
  recorded_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_location_user (user_id),
  INDEX idx_loc_user (user_id),
  INDEX idx_loc_recorded (recorded_at),
  CONSTRAINT fk_loc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_loc_lat CHECK (latitude  BETWEEN -90  AND 90),
  CONSTRAINT chk_loc_lng CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. LOCATION SHARING PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS location_sharing_permissions (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  owner_id      VARCHAR(36)  NOT NULL COMMENT 'User whose location is shared',
  viewer_id     VARCHAR(36)  NOT NULL COMMENT 'User who can see the location',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  share_mode    ENUM('always','temporary','paused') NOT NULL DEFAULT 'always',
  expires_at    DATETIME     NULL COMMENT 'NULL = no expiry',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sharing (owner_id, viewer_id),
  INDEX idx_sharing_owner (owner_id),
  INDEX idx_sharing_viewer (viewer_id),
  INDEX idx_sharing_active (is_active),
  INDEX idx_sharing_expires (expires_at),
  CONSTRAINT fk_sharing_owner  FOREIGN KEY (owner_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sharing_viewer FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. LOCATION HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS location_history (
  id            VARCHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)     NOT NULL,
  latitude      DECIMAL(10,8)   NOT NULL,
  longitude     DECIMAL(11,8)   NOT NULL,
  accuracy      FLOAT           NULL,
  altitude      FLOAT           NULL,
  heading       FLOAT           NULL,
  speed         FLOAT           NULL,
  recorded_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_lh_user (user_id),
  INDEX idx_lh_recorded (recorded_at),
  INDEX idx_lh_user_time (user_id, recorded_at),
  CONSTRAINT fk_lh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_lh_lat CHECK (latitude  BETWEEN -90  AND 90),
  CONSTRAINT chk_lh_lng CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  type          ENUM('direct','group') NOT NULL DEFAULT 'direct',
  name          VARCHAR(100) NULL COMMENT 'For group chats',
  created_by    VARCHAR(36)  NOT NULL,
  last_message_at DATETIME   NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conv_creator (created_by),
  INDEX idx_conv_last_message (last_message_at),
  CONSTRAINT fk_conv_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. CONVERSATION MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_members (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  conversation_id VARCHAR(36)  NOT NULL,
  user_id         VARCHAR(36)  NOT NULL,
  last_read_at    DATETIME     NULL,
  joined_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conv_member (conversation_id, user_id),
  INDEX idx_cm_conversation (conversation_id),
  INDEX idx_cm_user (user_id),
  CONSTRAINT fk_cm_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_user         FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  conversation_id VARCHAR(36)  NOT NULL,
  sender_id       VARCHAR(36)  NOT NULL,
  content         TEXT         NOT NULL,
  type            ENUM('text','image','location') NOT NULL DEFAULT 'text',
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_msg_conversation (conversation_id),
  INDEX idx_msg_sender (sender_id),
  INDEX idx_msg_created (created_at),
  CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender       FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)  NOT NULL,
  type          ENUM(
    'friend_request','friend_accepted','new_message',
    'location_sharing_started','location_sharing_stopped',
    'navigation_started','arrival','system'
  ) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT         NULL,
  data          JSON         NULL COMMENT 'Extra context data',
  is_read       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read),
  INDEX idx_notif_created (created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                    VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id               VARCHAR(36)  NOT NULL,
  language              VARCHAR(10)  NOT NULL DEFAULT 'km',
  theme                 ENUM('light','dark','system') NOT NULL DEFAULT 'light',
  share_location        TINYINT(1)   NOT NULL DEFAULT 0,
  share_mode            ENUM('all_friends','selected','paused') NOT NULL DEFAULT 'all_friends',
  location_history_enabled TINYINT(1) NOT NULL DEFAULT 0,
  history_retention_days INT         NOT NULL DEFAULT 7,
  notify_friend_request TINYINT(1)   NOT NULL DEFAULT 1,
  notify_messages       TINYINT(1)   NOT NULL DEFAULT 1,
  notify_location_share TINYINT(1)   NOT NULL DEFAULT 1,
  notify_arrival        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_settings_user (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. NAVIGATION SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_sessions (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id         VARCHAR(36)  NOT NULL,
  target_user_id  VARCHAR(36)  NOT NULL,
  transport_mode  ENUM('driving','walking','cycling') NOT NULL DEFAULT 'driving',
  status          ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  origin_lat      DECIMAL(10,8) NOT NULL,
  origin_lng      DECIMAL(11,8) NOT NULL,
  dest_lat        DECIMAL(10,8) NOT NULL,
  dest_lng        DECIMAL(11,8) NOT NULL,
  distance_m      INT           NULL COMMENT 'Route distance in meters',
  duration_s      INT           NULL COMMENT 'Route duration in seconds',
  arrived_at      DATETIME      NULL,
  started_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at        DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_nav_user (user_id),
  INDEX idx_nav_target (target_user_id),
  INDEX idx_nav_status (status),
  CONSTRAINT fk_nav_user   FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_nav_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. NAVIGATION EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_events (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  session_id      VARCHAR(36)   NOT NULL,
  event_type      ENUM('started','location_updated','route_recalculated','step_completed','arrived','ended') NOT NULL,
  user_lat        DECIMAL(10,8) NULL,
  user_lng        DECIMAL(11,8) NULL,
  dest_lat        DECIMAL(10,8) NULL,
  dest_lng        DECIMAL(11,8) NULL,
  remaining_m     INT           NULL,
  remaining_s     INT           NULL,
  event_data      JSON          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ne_session (session_id),
  INDEX idx_ne_type (event_type),
  CONSTRAINT fk_ne_session FOREIGN KEY (session_id) REFERENCES navigation_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRIGGERS: auto-create settings on user insert
-- ============================================================
DELIMITER $$
CREATE TRIGGER trg_user_settings_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
END$$
DELIMITER ;
