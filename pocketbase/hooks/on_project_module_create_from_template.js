onRecordAfterCreateSuccess((e) => {
  const templateId = e.record.getString('template_id')
  if (!templateId) return e.next()

  const projectId = e.record.getString('project')
  const moduleId = e.record.id

  try {
    const taskTemplates = $app.findRecordsByFilter(
      'task_templates',
      'discipline_template={:id}',
      'ordem',
      1000,
      0,
      { id: templateId },
    )

    const tasksCol = $app.findCollectionByNameOrId('tasks')

    for (const tt of taskTemplates) {
      const tRecord = new Record(tasksCol)
      tRecord.set('title', tt.getString('title'))
      tRecord.set('description', tt.getString('description'))
      tRecord.set('ordem', tt.getInt('ordem'))
      tRecord.set('priority', tt.getString('priority') || 'Média')
      tRecord.set('is_internal', tt.getBool('is_internal'))
      tRecord.set('status', 'Pendente')
      tRecord.set('project', projectId)
      tRecord.set('module', moduleId)
      $app.save(tRecord)
    }
  } catch (err) {
    $app
      .logger()
      .error(
        'Error creating tasks from discipline template',
        'error',
        err.message,
        'templateId',
        templateId,
      )
  }

  return e.next()
}, 'project_modules')
