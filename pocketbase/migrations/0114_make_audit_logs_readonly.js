migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.updateRule = null
    col.deleteRule = null
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('audit_logs')
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"
    app.save(col)
  },
)
