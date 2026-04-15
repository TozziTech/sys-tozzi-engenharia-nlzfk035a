migrate(
  (app) => {
    let adminId
    try {
      const admin = app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')
      adminId = admin.id
    } catch (_) {
      console.log('Admin user not found. Skipping migration.')
      return
    }

    const targetId = '8lnzq2b2hco1mzl'
    let targetUser
    try {
      targetUser = app.findRecordById('users', targetId)
    } catch (_) {
      console.log(
        "Target user 'Projetista Costa' already deleted or not found. Skipping migration.",
      )
      return
    }

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
        app
          .db()
          .newQuery(
            `UPDATE ${u.table} SET ${u.column} = {:adminId} WHERE ${u.column} = {:targetId}`,
          )
          .bind({ adminId: adminId, targetId: targetId })
          .execute()
      } catch (err) {
        console.log(`Failed to update ${u.table}.${u.column}:`, err)
      }
    })

    try {
      app.delete(targetUser)
      console.log("User 'Projetista Costa' successfully deleted and records reassigned.")
    } catch (err) {
      console.log('Failed to delete target user:', err)
    }
  },
  (app) => {
    // Reverting this migration is not feasible since we cannot determine which records originally belonged to the deleted user.
  },
)
