cronAdd('weekly_project_summary', '0 8 * * 1', () => {
  const schedules = $app.findRecordsByFilter(
    'report_schedules',
    "active = true && frequency = 'Semanal' && project != null",
    '',
    1000,
    0,
  )

  for (const schedule of schedules) {
    const projectId = schedule.getString('project')
    if (!projectId) continue

    let project
    try {
      project = $app.findRecordById('projects', projectId)
    } catch (_) {
      continue
    }

    const recipientsStr = schedule.getString('recipients')
    if (!recipientsStr) continue

    const recipients = recipientsStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
    if (recipients.length === 0) continue

    // Gather data
    const modules = $app.findRecordsByFilter(
      'project_modules',
      `project = '${projectId}'`,
      '-updated',
      1000,
      0,
    )
    let completed = 0
    let totalModules = modules.length
    for (const m of modules) {
      if (m.getString('status') === 'Concluído') completed++
    }

    const financialRecords = $app.findRecordsByFilter(
      'financial_records',
      `project_id = '${projectId}'`,
      '-date',
      1000,
      0,
    )
    let totalIn = 0
    let totalOut = 0
    for (const r of financialRecords) {
      if (r.getString('type') === 'Entrada') totalIn += r.getFloat('amount')
      if (r.getString('type') === 'Saída' && r.getBool('is_approved'))
        totalOut += r.getFloat('amount')
    }

    const budget = project.getFloat('budget') || 0
    const progress =
      project.getFloat('progress') ||
      (totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0)

    // Format currency manually to avoid Intl.NumberFormat issues in goja
    const formatCurrency = (val) => {
      return val.toFixed(2).replace('.', ',')
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Resumo Executivo Semanal</h2>
        <h3 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Projeto: ${project.getString('name')}</h3>
        
        <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Cliente:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${project.getString('client') || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${project.getString('status')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Progresso Geral:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${progress}%</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Disciplinas Concluídas:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${completed} de ${totalModules}</td>
          </tr>
        </table>
        
        <h4 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Saúde Financeira</h4>
        <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Orçamento:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">R$ ${formatCurrency(budget)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Despesas Aprovadas:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #dc2626;">R$ ${formatCurrency(totalOut)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Saldo Disponível:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #16a34a;">R$ ${formatCurrency(Math.max(0, budget - totalOut))}</td>
          </tr>
        </table>
        
        <p style="margin-top: 32px; font-size: 12px; color: #64748b; text-align: center;">
          Este é um e-mail automático gerado pelo sistema.<br>
          Para parar de receber, acesse as configurações do projeto.
        </p>
      </div>
    `

    const message = new MailerMessage({
      from: { address: $app.settings().meta.senderAddress, name: $app.settings().meta.senderName },
      to: recipients.map((email) => ({ address: email })),
      subject: `Resumo Semanal - ${project.getString('name')}`,
      html: html,
    })

    try {
      $app.newMailClient().send(message)
    } catch (err) {
      $app
        .logger()
        .error('Failed to send weekly project summary', 'project', projectId, 'error', err.message)
    }

    schedule.set('last_run', new Date().toISOString())
    $app.save(schedule)
  }
})
