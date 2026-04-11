onRecordUpdateRequest((e) => {
  const record = e.record

  let oldRecord = null
  try {
    oldRecord = $app.findRecordById('projects', record.id)
  } catch (err) {
    // ignore if not found
  }

  const spent = record.get('spent') || 0
  const budget = record.get('budget') || 0
  const progress = record.get('progress') || 0
  const endDateStr = record.get('end_date')

  let isCritical = false
  let reason = []

  if (budget > 0 && spent > budget) {
    isCritical = true
    reason.push('Orçamento excedido')
  }

  if (progress < 100 && endDateStr) {
    const endDate = new Date(endDateStr)
    const now = new Date()
    if (endDate < now) {
      isCritical = true
      reason.push('Prazo ultrapassado')
    }
  }

  let wasCritical = false
  if (oldRecord) {
    const oldSpent = oldRecord.get('spent') || 0
    const oldBudget = oldRecord.get('budget') || 0
    const oldProgress = oldRecord.get('progress') || 0
    const oldEndDateStr = oldRecord.get('end_date')

    if (oldBudget > 0 && oldSpent > oldBudget) {
      wasCritical = true
    }
    if (oldProgress < 100 && oldEndDateStr) {
      const oldEndDate = new Date(oldEndDateStr)
      const now = new Date()
      if (oldEndDate < now) {
        wasCritical = true
      }
    }
  }

  if (isCritical && !wasCritical && e.auth) {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('user_id', e.auth.id)
      log.set('action', 'CRITICAL_BOTTLENECK')
      log.set('resource', record.get('name'))
      log.set('details', { project_id: record.id, reasons: reason })
      $app.save(log)
    } catch (err) {
      console.log('Error saving bottleneck audit log:', err)
    }
  }

  e.next()
}, 'projects')
