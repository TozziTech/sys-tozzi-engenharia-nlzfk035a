migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    col.fields.add(
      new SelectField({
        name: 'discipline',
        values: [
          'Concreto Armado',
          'Metálico',
          'Hidrossanitário',
          'Elétrico',
          'Prevenção de Incêndio',
          'Gases',
          'Constr. Civil',
          'Patologia',
          'Outros',
        ],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    col.fields.removeByName('discipline')
    app.save(col)
  },
)
