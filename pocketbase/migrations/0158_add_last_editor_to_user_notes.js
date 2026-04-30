migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')

    if (!col.fields.getByName('last_editor')) {
      col.fields.add(
        new RelationField({
          name: 'last_editor',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    const rule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto' || (project != '' && project.user_project_access_via_project.user ?= @request.auth.id))"

    col.listRule = rule
    col.viewRule = rule
    col.updateRule = rule

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')

    col.fields.removeByName('last_editor')

    const oldRule = "@request.auth.id != '' && user = @request.auth.id"
    col.listRule = oldRule
    col.viewRule = oldRule
    col.updateRule = oldRule

    app.save(col)
  },
)
