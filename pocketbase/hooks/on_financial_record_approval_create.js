onRecordAfterCreateSuccess((e) => {
  try {
    const projectId = e.record.getString('project_id')
    if (!projectId) return e.next()

    const result = $app
      .db()
      .newQuery(`
      SELECT SUM(amount) as total
      FROM financial_records
      WHERE project_id = {:projectId} 
        AND type = 'Saída' 
        AND is_approved = 1 
        AND status != 'Cancelado'
    `)
      .bind({ projectId })
      .one()

    const project = $app.findRecordById('projects', projectId)
    project.set('spent', result.total || 0)
    $app.saveNoValidate(project)
  } catch (err) {
    $app.logger().error('Error updating project spent on create', 'error', err.message)
  }
  return e.next()
}, 'financial_records')
