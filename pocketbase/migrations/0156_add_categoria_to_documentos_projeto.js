migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_projeto')
    col.fields.add(
      new SelectField({
        name: 'categoria',
        maxSelect: 1,
        values: [
          'Legal',
          'Arquitetura',
          'Engenharia',
          'Financeiro',
          'Relatórios',
          'Contratos',
          'Outros',
        ],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_projeto')
    col.fields.removeByName('categoria')
    app.save(col)
  },
)
