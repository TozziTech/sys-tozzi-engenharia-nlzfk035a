onRecordDelete((e) => {
  const projectId = e.record.id
  const limit = 10000
  const offset = 0

  // 1. Delete tasks first to prevent module/parent relation constraints
  let tasks = $app.findRecordsByFilter('tasks', 'project = {:id}', '-created', limit, offset, {
    id: projectId,
  })
  let loopCount = 0
  // Use a retry loop to handle self-referencing parent_task constraints gracefully
  while (tasks.length > 0 && loopCount < 10) {
    const remaining = []
    for (let t of tasks) {
      try {
        $app.delete(t)
      } catch (err) {
        remaining.push(t)
      }
    }
    tasks = remaining
    loopCount++
  }

  // 2. project_modules & project_versions
  const modules = $app.findRecordsByFilter(
    'project_modules',
    'project = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let mod of modules) {
    const versions = $app.findRecordsByFilter(
      'project_versions',
      'module = {:id}',
      '-created',
      limit,
      offset,
      { id: mod.id },
    )
    for (let v of versions) {
      $app.delete(v)
    }
    $app.delete(mod)
  }

  // 3. tarefas_hierarquicas
  let th = $app.findRecordsByFilter(
    'tarefas_hierarquicas',
    'projeto_id = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  loopCount = 0
  while (th.length > 0 && loopCount < 10) {
    const remaining = []
    for (let t of th) {
      try {
        $app.delete(t)
      } catch (err) {
        remaining.push(t)
      }
    }
    th = remaining
    loopCount++
  }

  // 4. colunas_projeto
  const cols = $app.findRecordsByFilter(
    'colunas_projeto',
    'projeto_id = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let c of cols) {
    $app.delete(c)
  }

  // 5. time_logs
  const logs = $app.findRecordsByFilter(
    'time_logs',
    'project_id = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let l of logs) {
    $app.delete(l)
  }

  // 6. project_documents
  const docs = $app.findRecordsByFilter(
    'project_documents',
    'project = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let d of docs) {
    $app.delete(d)
  }

  // 7. user_notes
  const notes = $app.findRecordsByFilter(
    'user_notes',
    'project = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let n of notes) {
    $app.delete(n)
  }

  // 8. financial_records
  const finRecords = $app.findRecordsByFilter(
    'financial_records',
    'project_id = {:id}',
    '-created',
    limit,
    offset,
    { id: projectId },
  )
  for (let r of finRecords) {
    $app.delete(r)
  }

  // Audit log for project deletion
  try {
    let userId = ''
    if (e.auth && e.auth.id) {
      userId = e.auth.id
    } else {
      try {
        const fallbackUser = $app.findFirstRecordByFilter('users', '1=1')
        if (fallbackUser) userId = fallbackUser.id
      } catch (_) {}
    }

    if (userId) {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('user_id', userId)
      log.set('action', 'delete')
      log.set('resource', 'projects')
      log.set('details', { deleted_project_id: projectId, project_name: e.record.get('name') })
      $app.saveNoValidate(log)
    }
  } catch (err) {
    console.log('Audit log error in on_project_delete:', err)
  }

  e.next()
}, 'projects')
