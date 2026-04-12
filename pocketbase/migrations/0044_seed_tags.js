migrate(
  (app) => {
    const tagsCol = app.findCollectionByNameOrId('tags')
    const tagsToSeed = [
      { name: 'Urgente', color: '#ef4444' },
      { name: 'Pesquisa', color: '#3b82f6' },
      { name: 'Revisão', color: '#eab308' },
    ]

    for (const t of tagsToSeed) {
      try {
        app.findFirstRecordByData('tags', 'name', t.name)
      } catch (_) {
        const record = new Record(tagsCol)
        record.set('name', t.name)
        record.set('color', t.color)
        app.save(record)
      }
    }
  },
  (app) => {
    const names = ['Urgente', 'Pesquisa', 'Revisão']
    for (const n of names) {
      try {
        const record = app.findFirstRecordByData('tags', 'name', n)
        app.delete(record)
      } catch (_) {}
    }
  },
)
