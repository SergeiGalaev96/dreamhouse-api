BEGIN;

ALTER TABLE construction.warehouse_transfers
  ADD COLUMN IF NOT EXISTS posted_at timestamp without time zone;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'created_user_id'
  ) THEN
    ALTER TABLE construction.warehouse_transfers
      RENAME COLUMN created_by TO created_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_user_id'
  ) THEN
    ALTER TABLE construction.warehouse_transfers
      RENAME COLUMN sender_signed_by TO sender_signed_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_time'
  ) THEN
    ALTER TABLE construction.warehouse_transfers
      RENAME COLUMN sender_signed_at TO sender_signed_time;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_user_id'
  ) THEN
    ALTER TABLE construction.warehouse_transfers
      RENAME COLUMN receiver_signed_by TO receiver_signed_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_time'
  ) THEN
    ALTER TABLE construction.warehouse_transfers
      RENAME COLUMN receiver_signed_at TO receiver_signed_time;
  END IF;
END $$;

ALTER TABLE construction.warehouse_transfers
  ADD COLUMN IF NOT EXISTS created_user_id integer,
  ADD COLUMN IF NOT EXISTS sender_signed_user_id integer,
  ADD COLUMN IF NOT EXISTS sender_signed_time timestamp without time zone,
  ADD COLUMN IF NOT EXISTS receiver_signed_user_id integer,
  ADD COLUMN IF NOT EXISTS receiver_signed_time timestamp without time zone;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'created_by'
  ) THEN
    EXECUTE 'UPDATE construction.warehouse_transfers SET created_user_id = COALESCE(created_user_id, created_by)';
    ALTER TABLE construction.warehouse_transfers DROP COLUMN created_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_by'
  ) THEN
    EXECUTE 'UPDATE construction.warehouse_transfers SET sender_signed_user_id = COALESCE(sender_signed_user_id, sender_signed_by)';
    ALTER TABLE construction.warehouse_transfers DROP COLUMN sender_signed_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'sender_signed_at'
  ) THEN
    EXECUTE 'UPDATE construction.warehouse_transfers SET sender_signed_time = COALESCE(sender_signed_time, sender_signed_at)';
    ALTER TABLE construction.warehouse_transfers DROP COLUMN sender_signed_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_by'
  ) THEN
    EXECUTE 'UPDATE construction.warehouse_transfers SET receiver_signed_user_id = COALESCE(receiver_signed_user_id, receiver_signed_by)';
    ALTER TABLE construction.warehouse_transfers DROP COLUMN receiver_signed_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'warehouse_transfers'
      AND column_name = 'receiver_signed_at'
  ) THEN
    EXECUTE 'UPDATE construction.warehouse_transfers SET receiver_signed_time = COALESCE(receiver_signed_time, receiver_signed_at)';
    ALTER TABLE construction.warehouse_transfers DROP COLUMN receiver_signed_at;
  END IF;
END $$;

UPDATE construction.warehouse_transfers
SET posted_at = COALESCE(posted_at, updated_at, created_at)
WHERE status = 4
  AND posted_at IS NULL;

ALTER TABLE construction.warehouse_transfers
  DROP COLUMN IF EXISTS transfer_date;

COMMIT;
