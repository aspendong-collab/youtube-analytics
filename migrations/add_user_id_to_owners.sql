-- Migration: Add userId column to owners table
-- Date: 2026-02-03

-- Add userId column to owners table (if not exists)
ALTER TABLE owners ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);

-- Add foreign key constraint to users table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'owners_user_id_fkey'
    ) THEN
        ALTER TABLE owners
        ADD CONSTRAINT owners_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add index on userId column (if not exists)
CREATE INDEX IF NOT EXISTS owners_user_id_idx ON owners(user_id);
