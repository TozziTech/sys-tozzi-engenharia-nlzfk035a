migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('_pb_users_auth_').id
    const projectsId = app.findCollectionByNameOrId('projects').id
    const equipmentsId = app.findCollectionByNameOrId('equipments').id

    const timeLogs = new Collection({
      name: 'time_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'user_id', type: 'relation', collectionId: usersId, required: true, maxSelect: 1 },
        {
          name: 'project_id',
          type: 'relation',
          collectionId: projectsId,
          required: true,
          maxSelect: 1,
        },
        { name: 'hours', type: 'number', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(timeLogs)

    const equipmentLoans = new Collection({
      name: 'equipment_loans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'equipment_id',
          type: 'relation',
          collectionId: equipmentsId,
          required: true,
          maxSelect: 1,
        },
        { name: 'user_id', type: 'relation', collectionId: usersId, required: true, maxSelect: 1 },
        { name: 'loan_date', type: 'date', required: true },
        { name: 'return_date', type: 'date', required: false },
        {
          name: 'status',
          type: 'select',
          values: ['Ativo', 'Devolvido'],
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(equipmentLoans)
  },
  (app) => {
    try {
      const timeLogs = app.findCollectionByNameOrId('time_logs')
      app.delete(timeLogs)
    } catch (e) {}

    try {
      const equipmentLoans = app.findCollectionByNameOrId('equipment_loans')
      app.delete(equipmentLoans)
    } catch (e) {}
  },
)
