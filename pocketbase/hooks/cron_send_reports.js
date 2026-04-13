cronAdd('send_executive_reports', '0 8 * * *', () => {
  try {
    const schedules = $app.findRecordsByFilter('report_schedules', 'active = true', '', 100, 0)
    if (!schedules || schedules.length === 0) return

    const now = new Date()
    const projects = $app.findRecordsByFilter(
      'projects',
      "status != 'Concluído'",
      '-created',
      1000,
      0,
    )

    let htmlContent = '<h2>Relatório Executivo de Projetos</h2>'
    htmlContent += '<p>Abaixo está o status atualizado dos projetos ativos no sistema:</p>'
    htmlContent +=
      "<table border='1' cellpadding='8' style='border-collapse: collapse; width: 100%; font-family: sans-serif;'>"
    htmlContent +=
      "<tr style='background-color: #f1f5f9;'><th align='left'>Projeto</th><th align='left'>Cliente</th><th align='left'>Status</th><th align='left'>Progresso</th><th align='left'>Responsável</th></tr>"
    projects.forEach((p) => {
      htmlContent += `<tr>
        <td>${p.get('name')}</td>
        <td>${p.get('client') || '-'}</td>
        <td>${p.get('status')}</td>
        <td>${p.get('progress')}%</td>
        <td>${p.get('engineer') || '-'}</td>
      </tr>`
    })
    htmlContent += '</table>'
    htmlContent +=
      "<p style='margin-top: 30px; font-size: 12px; color: #64748b;'>Este é um relatório gerado automaticamente pelo Sistema de Projetos.</p>"

    schedules.forEach((schedule) => {
      const freq = schedule.get('frequency')
      const lastRunStr = schedule.get('last_run')
      let shouldRun = false

      if (!lastRunStr) {
        shouldRun = true
      } else {
        const lastRun = new Date(lastRunStr)
        const diffDays = (now - lastRun) / (1000 * 60 * 60 * 24)
        if (freq === 'Diário' && diffDays >= 0.9) shouldRun = true
        if (freq === 'Semanal' && diffDays >= 6.9) shouldRun = true
        if (freq === 'Mensal' && diffDays >= 27) shouldRun = true
      }

      if (shouldRun) {
        const recipients = schedule
          .get('recipients')
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e)
        if (recipients.length > 0) {
          try {
            const message = new MailerMessage({
              from: { address: 'relatorios@skip.cloud', name: 'Sistema de Projetos' },
              to: recipients.map((r) => ({ address: r })),
              subject: 'Relatório Executivo de Projetos Automático',
              html: htmlContent,
            })
            $app.newMailClient().send(message)
          } catch (e) {
            console.log('Falha ao enviar email do relatório automático:', e)
          }
        }

        schedule.set('last_run', now.toISOString())
        $app.save(schedule)
      }
    })
  } catch (err) {
    console.log('Cron error in send_executive_reports:', err)
  }
})
