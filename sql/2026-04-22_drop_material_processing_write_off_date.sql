BEGIN;

ALTER TABLE construction.material_processing_write_offs
  ADD COLUMN IF NOT EXISTS posted_at timestamp without time zone;

UPDATE construction.material_processing_write_offs
SET posted_at = COALESCE(posted_at, updated_at, created_at)
WHERE status = 3
  AND posted_at IS NULL;

COMMIT;
