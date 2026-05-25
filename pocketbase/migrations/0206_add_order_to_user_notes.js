migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('user_notes')
    collection.fields.add(new NumberField({ name: 'ordem' }))
    collection.addIndex('idx_user_notes_ordem', false, 'project, ordem', '')
    app.save(collection)

    try {
      const notes = app.findRecordsByFilter(
        'user_notes',
        "project != ''",
        'project,created',
        10000,
        0,
      )
      let currentProject = ''
      let currentOrder = 1
      for (const note of notes) {
        const p = note.get('project')
        if (p !== currentProject) {
          currentProject = p
          currentOrder = 1
        }
        note.set('ordem', currentOrder)
        app.saveNoValidate(note)
        currentOrder++
      }
    } catch (_) {}
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('user_notes')
    collection.removeIndex('idx_user_notes_ordem')
    collection.fields.removeByName('ordem')
    app.save(collection)
  },
)
