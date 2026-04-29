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

    const templateType = schedule.getString('template_type') || 'Executivo'

    // Format currency manually to avoid Intl.NumberFormat issues in goja
    const formatCurrency = (val) => {
      return val.toFixed(2).replace('.', ',')
    }

    let html = ''

    if (templateType === 'Executivo') {
      html = `
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
    } else if (templateType === 'Técnico') {
      const modulesList = modules
        .slice(0, 10)
        .map((m) => {
          const d = m.getString('deadline')
            ? new Date(m.getString('deadline')).toLocaleDateString('pt-BR')
            : 'N/A'
          const color =
            m.getString('status') === 'Concluído'
              ? '#16a34a'
              : m.getString('status') === 'Pendente'
                ? '#f59e0b'
                : '#3b82f6'
          return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${m.getString('name')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: ${color}; font-weight: bold;">${m.getString('status')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">${d}</td>
          </tr>
        `
        })
        .join('')

      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Resumo Técnico Semanal</h2>
          <h3 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Projeto: ${project.getString('name')}</h3>
          
          <p><strong>Progresso Geral:</strong> ${progress}%</p>
          <p><strong>Disciplinas Concluídas:</strong> ${completed} de ${totalModules}</p>
          
          <h4 style="color: #334155; margin-top: 24px;">Status das Disciplinas (Top 10)</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left;">
                <th style="padding: 8px;">Disciplina</th>
                <th style="padding: 8px;">Status</th>
                <th style="padding: 8px; text-align: right;">Prazo</th>
              </tr>
            </thead>
            <tbody>
              ${modulesList}
            </tbody>
          </table>
          
          <p style="margin-top: 32px; font-size: 12px; color: #64748b; text-align: center;">
            Este é um e-mail automático gerado pelo sistema.<br>
            Para parar de receber, acesse as configurações do projeto.
          </p>
        </div>
      `
    } else if (templateType === 'Focado em Gráficos') {
      const budgetPct = budget > 0 ? Math.min(100, Math.round((totalOut / budget) * 100)) : 0

      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Dashboard do Projeto</h2>
          <h3 style="color: #334155; text-align: center; margin-bottom: 24px;">${project.getString('name')}</h3>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #475569;">Progresso da Obra</h4>
            <div style="background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; width: 100%;">
              <div style="background: #3b82f6; width: ${progress}%; height: 100%; text-align: center; color: white; font-size: 12px; line-height: 24px; font-weight: bold;">
                ${progress}%
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #475569;">Orçamento Consumido</h4>
            <div style="background: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; width: 100%;">
              <div style="background: ${budgetPct > 90 ? '#ef4444' : '#10b981'}; width: ${budgetPct}%; height: 100%; text-align: center; color: white; font-size: 12px; line-height: 24px; font-weight: bold;">
                ${budgetPct}% (R$ ${formatCurrency(totalOut)})
              </div>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; text-align: right;">Total: R$ ${formatCurrency(budget)}</p>
          </div>
          
          <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0;">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${completed}</div>
              <div style="font-size: 12px; color: #15803d; text-transform: uppercase;">Concluídas</div>
            </div>
            <div style="flex: 1; background: #fffbeb; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #fde68a;">
              <div style="font-size: 24px; font-weight: bold; color: #d97706;">${totalModules - completed}</div>
              <div style="font-size: 12px; color: #b45309; text-transform: uppercase;">Pendentes</div>
            </div>
          </div>

          <p style="margin-top: 32px; font-size: 12px; color: #64748b; text-align: center;">
            Este é um e-mail automático gerado pelo sistema.<br>
            Para parar de receber, acesse as configurações do projeto.
          </p>
        </div>
      `
    }

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
