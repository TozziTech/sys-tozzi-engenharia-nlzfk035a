onRecordDelete((e) => {
  let admin
  try {
    admin = $app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')
  } catch (_) {
    return e.next()
  }

  const targetId = e.record.id

  // Prevent reassigning records if the admin is being deleted
  if (targetId === admin.id) {
    return e.next()
  }

  const adminId = admin.id

  const updates = [
    { table: 'audit_logs', column: 'user_id' },
    { table: 'time_logs', column: 'user_id' },
    { table: 'tasks', column: 'responsible' },
    { table: 'financial_records', column: 'responsible' },
    { table: 'servicos_financeiros', column: 'user_id' },
    { table: 'project_modules', column: 'responsible' },
    { table: 'project_modules', column: 'designer' },
    { table: 'project_versions', column: 'approved_by' },
    { table: 'notifications', column: 'user' },
    { table: 'equipment_loans', column: 'user_id' },
    { table: 'user_document_favorites', column: 'user_id' },
    { table: 'comentarios_projeto', column: 'autor' },
    { table: 'projetos_cliente', column: 'cliente' },
  ]

  updates.forEach((u) => {
    try {
      $app
        .db()
        .newQuery(`UPDATE ${u.table} SET ${u.column} = {:adminId} WHERE ${u.column} = {:targetId}`)
        .bind({ adminId: adminId, targetId: targetId })
        .execute()
    } catch (err) {
      console.log(`[onRecordDelete users] Failed to reassign ${u.table}.${u.column}:`, err)
    }
  })

  e.next()
}, 'users')
