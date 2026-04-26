migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != '' && autor = @request.auth.id"

    if (!col.fields.getByName('anexos')) {
      col.fields.add(
        new FileField({
          name: 'anexos',
          maxSelect: 5,
          maxSize: 10485760,
        }),
      )
    }

    const projetoIdField = col.fields.getByName('projeto_id')
    if (projetoIdField) {
      projetoIdField.required = false
    }

    if (!col.fields.getByName('projeto_interno_id')) {
      col.fields.add(
        new RelationField({
          name: 'projeto_interno_id',
          collectionId: app.findCollectionByNameOrId('projects').id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')

    col.listRule =
      "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')"
    col.viewRule =
      "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')"
    col.createRule = "@request.auth.id != ''"

    const anexosField = col.fields.getByName('anexos')
    if (anexosField) col.fields.removeById(anexosField.id)

    const projetoInternoIdField = col.fields.getByName('projeto_interno_id')
    if (projetoInternoIdField) col.fields.removeById(projetoInternoIdField.id)

    const projetoIdField = col.fields.getByName('projeto_id')
    if (projetoIdField) projetoIdField.required = true

    app.save(col)
  },
)
