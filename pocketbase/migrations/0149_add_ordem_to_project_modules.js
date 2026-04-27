migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')

    if (!col.fields.getByName('ordem')) {
      col.fields.add(new NumberField({ name: 'ordem' }))
      app.save(col)
    }

    // Update existing records to have sequential ordem per project
    const modules = app.findRecordsByFilter('project_modules', '', 'created', 10000, 0)
    const byProject = {}
    for (const mod of modules) {
      const p = mod.getString('project')
      if (!byProject[p]) byProject[p] = []
      byProject[p].push(mod)
    }

    for (const p in byProject) {
      let order = 1
      for (const mod of byProject[p]) {
        mod.set('ordem', order)
        app.save(mod)
        order++
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('ordem')
    app.save(col)
  },
)
