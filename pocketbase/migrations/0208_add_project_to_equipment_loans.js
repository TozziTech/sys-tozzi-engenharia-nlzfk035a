migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipment_loans')
    col.fields.add(
      new RelationField({
        name: 'project',
        collectionId: app.findCollectionByNameOrId('projects').id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    col.addIndex('idx_equipment_loans_project', false, 'project', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipment_loans')
    col.fields.removeByName('project')
    col.removeIndex('idx_equipment_loans_project')
    app.save(col)
  },
)
