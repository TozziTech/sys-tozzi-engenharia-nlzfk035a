migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.addIndex('idx_audit_logs_created', false, 'created', '')
    col.addIndex('idx_audit_logs_user_id', false, 'user_id', '')
    col.addIndex('idx_audit_logs_resource', false, 'resource', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.removeIndex('idx_audit_logs_created')
    col.removeIndex('idx_audit_logs_user_id')
    col.removeIndex('idx_audit_logs_resource')
    app.save(col)
  },
)
