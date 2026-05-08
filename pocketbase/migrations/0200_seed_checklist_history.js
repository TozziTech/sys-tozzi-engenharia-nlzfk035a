migrate(
  (app) => {
    const executionsCol = app.findCollectionByNameOrId('checklist_executions')

    const existing = app.countRecords('checklist_executions')
    if (existing > 0) return

    const templates = app.findRecordsByFilter('checklist_templates', '', '', 10, 0)
    const users = app.findRecordsByFilter('_pb_users_auth_', '', '', 10, 0)

    if (templates.length === 0 || users.length === 0) return

    const locations = [
      'Edifício Aurora',
      'Residencial Horizonte',
      'Torre Central',
      'Condomínio Vila Nova',
      'Shopping Plaza',
    ]

    for (let i = 0; i < 5; i++) {
      const template = templates[i % templates.length]
      const user = users[i % users.length]

      let templateItems = []
      try {
        const itemsRaw = template.get('items')
        if (typeof itemsRaw === 'string') {
          templateItems = JSON.parse(itemsRaw)
        } else if (Array.isArray(itemsRaw)) {
          templateItems = itemsRaw
        }
      } catch (e) {}

      let itemsCount = 0
      let itemsChecked = 0
      const responses = []

      templateItems.forEach((item, idx) => {
        const checked = idx % 2 === 0 || idx % 3 === 0
        responses.push({
          itemName: item.name || `Item ${idx + 1}`,
          checked: checked,
          notes: checked ? 'Tudo certo' : 'Faltou trazer',
        })
        itemsCount++
        if (checked) itemsChecked++
      })

      const score = itemsCount > 0 ? Math.round((itemsChecked / itemsCount) * 100) : 0

      const record = new Record(executionsCol)
      record.set('template', template.id)
      record.set(
        'inspection_date',
        new Date(Date.now() - i * 86400000 * 2).toISOString().split('T')[0] + ' 10:00:00.000Z',
      )
      record.set('location', locations[i])
      record.set('responses', responses)
      record.set('compliance_score', score)
      record.set('status', i % 2 === 0 ? 'concluído' : 'em_andamento')
      record.set('responsible', user.id)

      app.save(record)
    }
  },
  (app) => {
    // Safe rollback without data loss on production instances
  },
)
