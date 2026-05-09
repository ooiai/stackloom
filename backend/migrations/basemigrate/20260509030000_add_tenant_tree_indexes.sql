CREATE INDEX idx_tenants_parent_name_created_id
    ON tenants (parent_id, name, created_at, id)
    WHERE deleted_at IS NULL;
