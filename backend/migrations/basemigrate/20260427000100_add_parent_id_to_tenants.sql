ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS parent_id BIGINT NULL;

ALTER TABLE tenants
DROP CONSTRAINT IF EXISTS tenants_parent_id_fkey;

ALTER TABLE tenants
ADD CONSTRAINT tenants_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_tenants_parent_id ON tenants(parent_id);
