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
    const idMap = {} // Maps task_template ID to created task ID
    let remaining = [...taskTemplates]
    let loops = 0

    // Process tasks level by level resolving parent dependencies
    while (remaining.length > 0 && loops < 100) {
      loops++
      const nextRemaining = []

      for (const tt of remaining) {
        const parentTemplateId = tt.getString('parent_template')

        // If it requires a parent that hasn't been created yet, postpone it
        if (parentTemplateId && !idMap[parentTemplateId]) {
          nextRemaining.push(tt)
          continue
        }

        const tRecord = new Record(tasksCol)
        tRecord.set('title', tt.getString('title'))
        tRecord.set('description', tt.getString('description'))
        tRecord.set('ordem', tt.getInt('ordem'))
        tRecord.set('priority', tt.getString('priority') || 'Média')
        tRecord.set('is_internal', tt.getBool('is_internal'))
        tRecord.set('status', 'Pendente')
        tRecord.set('project', projectId)
        tRecord.set('module', moduleId)

        if (parentTemplateId) {
          tRecord.set('parent_task', idMap[parentTemplateId])
        }

        $app.save(tRecord)
        idMap[tt.id] = tRecord.id
      }

      // If we didn't process any items in this loop, there is an unresolvable reference cycle
      if (nextRemaining.length === remaining.length) {
        for (const tt of nextRemaining) {
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
        break
      }
      remaining = nextRemaining
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
