onRecordUpdateRequest(
  (e) => {
    const collectionName = e.collection.name
    const oldRecord = $app.findRecordById(collectionName, e.record.get('id'))
    const oldDate = oldRecord.get('due_date') || ''
    const newDate = e.record.get('due_date') || ''

    e.next()

    if (oldDate !== newDate && e.auth) {
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const audit = new Record(auditCol)
        audit.set('user_id', e.auth.get('id'))
        audit.set('action', 'Task Rescheduled')
        audit.set('resource', e.record.get('title') || e.record.get('titulo') || 'Tarefa')
        audit.set('details', { old_date: oldDate, new_date: newDate })
        $app.saveNoValidate(audit)
      } catch (err) {
        console.log('Error saving audit log', err)
      }
    }
  },
  'tasks',
  'tarefas_hierarquicas',
)
