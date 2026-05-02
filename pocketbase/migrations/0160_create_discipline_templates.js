migrate(
  (app) => {
    const disciplineTemplates = new Collection({
      name: 'discipline_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      updateRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      deleteRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(disciplineTemplates)

    const taskTemplates = new Collection({
      name: 'task_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      updateRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      deleteRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      fields: [
        {
          name: 'discipline_template',
          type: 'relation',
          required: true,
          collectionId: disciplineTemplates.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'ordem', type: 'number' },
        {
          name: 'priority',
          type: 'select',
          values: ['Baixa', 'Média', 'Alta', 'Urgente'],
          maxSelect: 1,
        },
        { name: 'is_internal', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(taskTemplates)

    const projectModules = app.findCollectionByNameOrId('project_modules')
    if (!projectModules.fields.getByName('template_id')) {
      projectModules.fields.add(
        new RelationField({
          name: 'template_id',
          collectionId: disciplineTemplates.id,
          maxSelect: 1,
        }),
      )
      app.save(projectModules)
    }
  },
  (app) => {
    try {
      const projectModules = app.findCollectionByNameOrId('project_modules')
      projectModules.fields.removeByName('template_id')
      app.save(projectModules)
    } catch (e) {}

    try {
      const taskTemplates = app.findCollectionByNameOrId('task_templates')
      app.delete(taskTemplates)
    } catch (e) {}

    try {
      const disciplineTemplates = app.findCollectionByNameOrId('discipline_templates')
      app.delete(disciplineTemplates)
    } catch (e) {}
  },
)
