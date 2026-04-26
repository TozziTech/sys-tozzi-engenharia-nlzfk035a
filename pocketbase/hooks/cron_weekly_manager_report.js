cronAdd('weekly_manager_report', '59 23 * * 0', () => {
  // 1. Fetch documents created or updated in the last 7 days
  const docs = $app.findRecordsByFilter(
    'project_documents',
    'created >= @now-7d || updated >= @now-7d',
    '-updated',
    1000,
    0,
  )

  // Expand project relation to get the project name
  for (const doc of docs) {
    $app.expandRecord(doc, ['project'])
  }

  // 2. Fetch recipients (Administrators and Project Managers)
  const users = $app.findRecordsByFilter(
    'users',
    "role = 'Administrador' || role = 'Gerente de Projeto'",
    '',
    1000,
    0,
  )

  const emails = []
  for (const u of users) {
    const email = u.email()
    if (email) emails.push(email)
  }

  if (emails.length === 0) {
    $app.logger().warn('No managers found to send weekly report.')
    return
  }

  // 3. Build HTML Report
  const dateObj = new Date()
  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  const dateStr = `${day}/${month}/${year}`

  let html = `<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">`
  html += `<h2 style="color: #333;">Relatório Semanal de Documentos e Feedbacks</h2>`
  html += `<p style="color: #666;">Semana de ${dateStr}</p>`

  if (docs.length === 0) {
    html += `<p style="padding: 16px; background-color: #f9fafb; border-radius: 8px; color: #374151;">Nenhuma atividade de documentos registrada nesta semana.</p>`
  } else {
    html += `<table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
                <tr style="background-color: #f3f4f6; color: #111827; border-bottom: 2px solid #e5e7eb;">
                    <th style="border: 1px solid #e5e7eb; padding: 12px;">Projeto</th>
                    <th style="border: 1px solid #e5e7eb; padding: 12px;">Documento</th>
                    <th style="border: 1px solid #e5e7eb; padding: 12px;">Prioridade</th>
                    <th style="border: 1px solid #e5e7eb; padding: 12px;">Feedback</th>
                </tr>
            </thead>
            <tbody>`

    for (const doc of docs) {
      const project = doc.expandedOne('project')
      const projectName = project ? project.getString('name') : 'Desconhecido'
      const docName = doc.getString('name')
      const isUrgent = doc.getBool('is_urgent')
      const priorityHtml = isUrgent
        ? `<span style="color: #dc2626; font-weight: bold;">Urgente</span>`
        : `<span style="color: #4b5563;">Normal</span>`
      const feedback =
        doc.getString('feedback') || `<span style="color: #9ca3af; font-style: italic;">-</span>`

      html += `<tr>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151;">${projectName}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151;">${docName}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">${priorityHtml}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #374151;">${feedback}</td>
            </tr>`
    }
    html += `</tbody></table>`
  }
  html += `</div>`

  // 4. Send Email
  const mailClient = $app.newMailClient()
  const subject = `[Relatório Semanal] Documentos e Feedbacks - Semana de ${dateStr}`
  const senderAddress = $app.settings().meta.senderAddress || 'noreply@sys-tozzi.com'
  const senderName = $app.settings().meta.senderName || 'SyS-TOZZI ENGENHARIA'

  for (const email of emails) {
    try {
      const message = new MailerMessage({
        from: {
          address: senderAddress,
          name: senderName,
        },
        to: [{ address: email }],
        subject: subject,
        html: html,
      })
      mailClient.send(message)
    } catch (err) {
      $app
        .logger()
        .error('Failed to send weekly report to ' + email, 'error', err.message || String(err))
    }
  }

  // 5. Update Schedule Log
  try {
    let schedule
    try {
      schedule = $app.findFirstRecordByFilter(
        'report_schedules',
        "frequency = 'Semanal' && recipients = 'Gestores de Documentos'",
      )
    } catch (_) {
      const collection = $app.findCollectionByNameOrId('report_schedules')
      schedule = new Record(collection)
      schedule.set('frequency', 'Semanal')
      schedule.set('recipients', 'Gestores de Documentos')
      schedule.set('active', true)
    }
    schedule.set('last_run', new Date().toISOString())
    $app.save(schedule)
  } catch (err) {
    $app.logger().error('Failed to update report_schedules', 'error', err.message || String(err))
  }
})
