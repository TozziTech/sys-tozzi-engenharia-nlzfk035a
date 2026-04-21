migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('cep')) col.fields.add(new TextField({ name: 'cep' }))
    if (!col.fields.getByName('logradouro')) col.fields.add(new TextField({ name: 'logradouro' }))
    if (!col.fields.getByName('numero')) col.fields.add(new TextField({ name: 'numero' }))
    if (!col.fields.getByName('bairro')) col.fields.add(new TextField({ name: 'bairro' }))
    if (!col.fields.getByName('cidade')) col.fields.add(new TextField({ name: 'cidade' }))
    if (!col.fields.getByName('uf')) col.fields.add(new TextField({ name: 'uf' }))
    if (!col.fields.getByName('alt_phone')) col.fields.add(new TextField({ name: 'alt_phone' }))
    if (!col.fields.getByName('contact_name'))
      col.fields.add(new TextField({ name: 'contact_name' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('cep')
    col.fields.removeByName('logradouro')
    col.fields.removeByName('numero')
    col.fields.removeByName('bairro')
    col.fields.removeByName('cidade')
    col.fields.removeByName('uf')
    col.fields.removeByName('alt_phone')
    col.fields.removeByName('contact_name')
    app.save(col)
  },
)
