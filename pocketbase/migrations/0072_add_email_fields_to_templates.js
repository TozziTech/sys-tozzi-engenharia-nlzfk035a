migrate(
  (app) => {
    const templates = app.findCollectionByNameOrId('contract_templates')
    templates.fields.add(new TextField({ name: 'email_subject' }))
    templates.fields.add(new TextField({ name: 'email_body' }))
    app.save(templates)

    const generated = app.findCollectionByNameOrId('generated_contracts')
    generated.fields.add(new TextField({ name: 'email_subject' }))
    generated.fields.add(new TextField({ name: 'email_body' }))
    app.save(generated)
  },
  (app) => {
    const templates = app.findCollectionByNameOrId('contract_templates')
    templates.fields.removeByName('email_subject')
    templates.fields.removeByName('email_body')
    app.save(templates)

    const generated = app.findCollectionByNameOrId('generated_contracts')
    generated.fields.removeByName('email_subject')
    generated.fields.removeByName('email_body')
    app.save(generated)
  },
)
