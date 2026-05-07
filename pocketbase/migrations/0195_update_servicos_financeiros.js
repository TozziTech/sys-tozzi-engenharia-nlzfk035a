migrate(
  (app) => {
    const servicos = app.findCollectionByNameOrId('servicos_financeiros')

    // Add project_ref
    if (!servicos.fields.getByName('project_ref')) {
      servicos.fields.add(
        new RelationField({
          name: 'project_ref',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Deduplicate before adding unique index
    app
      .db()
      .newQuery(`
    DELETE FROM servicos_financeiros WHERE id NOT IN (
      SELECT MIN(id) FROM servicos_financeiros GROUP BY codigo
    ) AND codigo IS NOT NULL AND codigo != ''
  `)
      .execute()

    // Make codigo unique
    servicos.addIndex('idx_servicos_financeiros_codigo_unique', true, 'codigo', '')
    app.save(servicos)

    const pagamentos = app.findCollectionByNameOrId('pagamentos_servicos')

    // Add user_id to decouple from servicos_financeiros
    if (!pagamentos.fields.getByName('user_id')) {
      pagamentos.fields.add(
        new RelationField({
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(pagamentos)
    }

    // Migrate user_id from related service
    app
      .db()
      .newQuery(`
    UPDATE pagamentos_servicos 
    SET user_id = COALESCE(
      (SELECT user_id FROM servicos_financeiros WHERE servicos_financeiros.id = pagamentos_servicos.servico_id),
      ''
    )
    WHERE servico_id IS NOT NULL AND servico_id != ''
  `)
      .execute()

    // Remove servico_id mapping
    const servicoIdField = pagamentos.fields.getByName('servico_id')
    if (servicoIdField) {
      pagamentos.fields.removeByName('servico_id')
      app.save(pagamentos)
    }
  },
  (app) => {
    const servicos = app.findCollectionByNameOrId('servicos_financeiros')
    servicos.removeIndex('idx_servicos_financeiros_codigo_unique')

    const projectRefField = servicos.fields.getByName('project_ref')
    if (projectRefField) {
      servicos.fields.removeByName('project_ref')
    }
    app.save(servicos)

    const pagamentos = app.findCollectionByNameOrId('pagamentos_servicos')
    if (!pagamentos.fields.getByName('servico_id')) {
      pagamentos.fields.add(
        new RelationField({
          name: 'servico_id',
          type: 'relation',
          collectionId: servicos.id,
          required: true,
          maxSelect: 1,
        }),
      )
      app.save(pagamentos)
    }
  },
)
