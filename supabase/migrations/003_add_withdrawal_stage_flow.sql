-- Add stage and flow_completed columns to withdrawal_requests
-- Safe migration: add columns only if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='withdrawal_requests' AND column_name='stage'
  ) THEN
    ALTER TABLE withdrawal_requests
      ADD COLUMN stage INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='withdrawal_requests' AND column_name='flow_completed'
  ) THEN
    ALTER TABLE withdrawal_requests
      ADD COLUMN flow_completed BOOLEAN DEFAULT FALSE;
  END IF;
END$$;

-- Add an index on stage for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_withdrawal_requests_stage'
  ) THEN
    CREATE INDEX idx_withdrawal_requests_stage ON withdrawal_requests(stage);
  END IF;
END$$;
