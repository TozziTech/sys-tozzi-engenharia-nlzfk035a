migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')
    col.fields.add(
      new JSONField({
        name: 'reactions',
        required: false,
        maxSize: 2000000,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')
    col.fields.removeByName('reactions')
    app.save(col)
  },
)
