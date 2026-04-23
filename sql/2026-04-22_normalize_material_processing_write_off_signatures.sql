BEGIN;

-- Приводим подписи актов переработки к общей схеме списаний:
-- *_user_id хранит пользователя подписи, signed_by_*_time хранит дату подписи.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'created_user_id'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN created_by TO created_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'created_by'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET created_user_id = COALESCE(created_user_id, created_by);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN created_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'foreman_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'foreman_user_id'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN foreman_signed_by TO foreman_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'foreman_signed_by'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET foreman_user_id = COALESCE(foreman_user_id, foreman_signed_by);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN foreman_signed_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'foreman_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'signed_by_foreman_time'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN foreman_signed_at TO signed_by_foreman_time;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'foreman_signed_at'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET signed_by_foreman_time = COALESCE(signed_by_foreman_time, foreman_signed_at);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN foreman_signed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'planning_engineer_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'planning_engineer_user_id'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN planning_engineer_signed_by TO planning_engineer_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'planning_engineer_signed_by'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET planning_engineer_user_id = COALESCE(planning_engineer_user_id, planning_engineer_signed_by);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN planning_engineer_signed_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'planning_engineer_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'signed_by_planning_engineer_time'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN planning_engineer_signed_at TO signed_by_planning_engineer_time;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'planning_engineer_signed_at'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET signed_by_planning_engineer_time = COALESCE(signed_by_planning_engineer_time, planning_engineer_signed_at);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN planning_engineer_signed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'main_engineer_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'main_engineer_user_id'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN main_engineer_signed_by TO main_engineer_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'main_engineer_signed_by'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET main_engineer_user_id = COALESCE(main_engineer_user_id, main_engineer_signed_by);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN main_engineer_signed_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'main_engineer_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'signed_by_main_engineer_time'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN main_engineer_signed_at TO signed_by_main_engineer_time;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'main_engineer_signed_at'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET signed_by_main_engineer_time = COALESCE(signed_by_main_engineer_time, main_engineer_signed_at);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN main_engineer_signed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'general_director_signed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'general_director_user_id'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN general_director_signed_by TO general_director_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'general_director_signed_by'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET general_director_user_id = COALESCE(general_director_user_id, general_director_signed_by);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN general_director_signed_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'general_director_signed_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'signed_by_general_director_time'
  ) THEN
    ALTER TABLE construction.material_processing_write_offs
      RENAME COLUMN general_director_signed_at TO signed_by_general_director_time;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'construction'
      AND table_name = 'material_processing_write_offs'
      AND column_name = 'general_director_signed_at'
  ) THEN
    UPDATE construction.material_processing_write_offs
    SET signed_by_general_director_time = COALESCE(signed_by_general_director_time, general_director_signed_at);

    ALTER TABLE construction.material_processing_write_offs
      DROP COLUMN general_director_signed_at;
  END IF;
END $$;

ALTER TABLE construction.material_processing_write_offs
  ADD COLUMN IF NOT EXISTS posted_at timestamp without time zone;

UPDATE construction.material_processing_write_offs
SET posted_at = COALESCE(posted_at, updated_at)
WHERE status = 3
  AND posted_at IS NULL;

UPDATE construction.material_processing_write_offs
SET
  signed_by_foreman = COALESCE(signed_by_foreman, false),
  signed_by_planning_engineer = COALESCE(signed_by_planning_engineer, false),
  signed_by_main_engineer = COALESCE(signed_by_main_engineer, false),
  signed_by_general_director = COALESCE(signed_by_general_director, false),
  deleted = COALESCE(deleted, false);

ALTER TABLE construction.material_processing_write_offs
  ALTER COLUMN signed_by_foreman SET DEFAULT false,
  ALTER COLUMN signed_by_planning_engineer SET DEFAULT false,
  ALTER COLUMN signed_by_main_engineer SET DEFAULT false,
  ALTER COLUMN signed_by_general_director SET DEFAULT false,
  ALTER COLUMN deleted SET DEFAULT false;

ALTER TABLE construction.material_processing_write_offs
  ALTER COLUMN signed_by_foreman SET NOT NULL,
  ALTER COLUMN signed_by_planning_engineer SET NOT NULL,
  ALTER COLUMN signed_by_main_engineer SET NOT NULL,
  ALTER COLUMN signed_by_general_director SET NOT NULL;

ALTER TABLE construction.material_processing_write_offs
  DROP COLUMN IF EXISTS updated_by;

COMMIT;
