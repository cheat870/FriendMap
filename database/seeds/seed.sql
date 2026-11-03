-- ============================================================
-- FRIENDMAP Seed Data (Development)
-- ============================================================

USE friendmap;

-- Seed users (passwords are all: Password123!)
-- Hash generated with bcrypt rounds=12
INSERT INTO users (id, username, email, password_hash, display_name, bio, role, status, email_verified) VALUES
(
  'usr_admin_001',
  'admin',
  'admin@friendmap.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHabvKGk6PO78rI3TVNWS',
  'FriendMap Admin',
  'System administrator',
  'admin',
  'active',
  1
),
(
  'usr_alice_001',
  'alice',
  'alice@friendmap.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHabvKGk6PO78rI3TVNWS',
  'Alice Chen',
  'Love exploring new places!',
  'user',
  'active',
  1
),
(
  'usr_bob_001',
  'bob',
  'bob@friendmap.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHabvKGk6PO78rI3TVNWS',
  'Bob Martinez',
  'Always on the move 🚗',
  'user',
  'active',
  1
),
(
  'usr_charlie_001',
  'charlie',
  'charlie@friendmap.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHabvKGk6PO78rI3TVNWS',
  'Charlie Kim',
  'Cyclist and hiker 🚴',
  'user',
  'active',
  1
);

-- Seed friendships (alice <-> bob, alice <-> charlie)
INSERT INTO friendships (id, user_id_1, user_id_2) VALUES
  ('fs_001', 'usr_alice_001', 'usr_bob_001'),
  ('fs_002', 'usr_alice_001', 'usr_charlie_001');

-- Seed friend requests (bob -> charlie pending)
INSERT INTO friend_requests (id, sender_id, receiver_id, status) VALUES
  ('fr_001', 'usr_bob_001', 'usr_charlie_001', 'pending');

-- Seed location sharing permissions (mutual between friends)
INSERT INTO location_sharing_permissions (id, owner_id, viewer_id, is_active, share_mode) VALUES
  ('lsp_001', 'usr_alice_001', 'usr_bob_001', 1, 'always'),
  ('lsp_002', 'usr_bob_001', 'usr_alice_001', 1, 'always'),
  ('lsp_003', 'usr_alice_001', 'usr_charlie_001', 1, 'always'),
  ('lsp_004', 'usr_charlie_001', 'usr_alice_001', 1, 'always');

-- Seed conversations
INSERT INTO conversations (id, type, created_by) VALUES
  ('conv_001', 'direct', 'usr_alice_001'),
  ('conv_002', 'direct', 'usr_alice_001');

INSERT INTO conversation_members (id, conversation_id, user_id) VALUES
  ('cm_001', 'conv_001', 'usr_alice_001'),
  ('cm_002', 'conv_001', 'usr_bob_001'),
  ('cm_003', 'conv_002', 'usr_alice_001'),
  ('cm_004', 'conv_002', 'usr_charlie_001');

-- Seed messages
INSERT INTO messages (id, conversation_id, sender_id, content) VALUES
  ('msg_001', 'conv_001', 'usr_alice_001', 'Hey Bob! Where are you?'),
  ('msg_002', 'conv_001', 'usr_bob_001', 'I am at the coffee shop on Main Street!'),
  ('msg_003', 'conv_001', 'usr_alice_001', 'I can see you on the map, coming over!'),
  ('msg_004', 'conv_002', 'usr_alice_001', 'Charlie, want to meet up for a ride?'),
  ('msg_005', 'conv_002', 'usr_charlie_001', 'Sure! Share your location and I will navigate there.');

UPDATE conversations SET last_message_at = NOW() WHERE id IN ('conv_001', 'conv_002');
