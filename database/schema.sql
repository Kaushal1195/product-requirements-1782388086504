-- Enable pgcrypto for gen_random_uuid() if not already enabled
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop tables if they exist to allow for clean re-runs during development
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

-- Create ENUM types for roles, task priority, and task status
CREATE TYPE USER_ROLE AS ENUM ('MANAGER', 'EMPLOYEE');
CREATE TYPE TASK_PRIORITY AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE TASK_STATUS AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED');

-- Table for Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role USER_ROLE NOT NULL DEFAULT 'EMPLOYEE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority TASK_PRIORITY NOT NULL DEFAULT 'MEDIUM',
    status TASK_STATUS NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    assigned_to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Manager who created the task
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Trigger to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tasks_timestamp
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Initial data (optional, for quick testing)
-- You might want to create a separate seed script for this in production
-- INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
-- ('manager@example.com', '$2a$10$YOUR_HASHED_PASSWORD_HERE', 'Manager', 'User', 'MANAGER'),
-- ('employee@example.com', '$2a$10$YOUR_HASHED_PASSWORD_HERE', 'Employee', 'User', 'EMPLOYEE');
