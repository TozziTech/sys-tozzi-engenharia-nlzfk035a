migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')

    col.fields.add(
      new FileField({
        name: 'attachments',
        maxSelect: 10,
        maxSize: 10485760, // 10MB per file
        protected: false,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('quotes')
    col.fields.removeByName('attachments')
    app.save(col)
  },
)
