onRecordAfterUpdateSuccess((e) => {
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

    const origProjectId = e.record.original().getString('project_id')
    if (origProjectId && origProjectId !== projectId) {
      const origResult = $app
        .db()
        .newQuery(`
        SELECT SUM(amount) as total
        FROM financial_records
        WHERE project_id = {:origProjectId} 
          AND type = 'Saída' 
          AND is_approved = 1 
          AND status != 'Cancelado'
      `)
        .bind({ origProjectId })
        .one()

      const origProject = $app.findRecordById('projects', origProjectId)
      origProject.set('spent', origResult.total || 0)
      $app.saveNoValidate(origProject)
    }
  } catch (err) {
    $app.logger().error('Error updating project spent on update', 'error', err.message)
  }
  return e.next()
}, 'financial_records')
