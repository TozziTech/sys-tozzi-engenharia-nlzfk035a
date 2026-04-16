migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.fields.add(new DateField({ name: 'deleted_at' }))
    col.addIndex('idx_projects_deleted_at', false, 'deleted_at', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.fields.removeByName('deleted_at')
    col.removeIndex('idx_projects_deleted_at')
    app.save(col)
  },
)
