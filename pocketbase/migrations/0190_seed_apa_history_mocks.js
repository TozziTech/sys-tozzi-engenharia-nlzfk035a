migrate((app) => {
  const reportsCol = app.findCollectionByNameOrId('apa_reports')
  const actionsCol = app.findCollectionByNameOrId('apa_actions')

  const projects = app.findRecordsByFilter('projects', '1=1', '-created', 3, 0)
  const users = app.findRecordsByFilter('users', '1=1', '', 2, 0)

  if (projects.length === 0 || users.length === 0) return

  const statuses = ['pendente', 'concluído']
  const actionStatuses = ['aberta', 'em_progresso', 'concluída']

  const pos = [
    'Equipe altamente engajada e prazos iniciais cumpridos com excelência.',
    'Ótima comunicação com o cliente durante a fase de execução.',
    'As novas ferramentas de software utilizadas aumentaram a produtividade.',
  ]
  const neg = [
    'Atraso na entrega de materiais essenciais pelos fornecedores principais.',
    'Falta de clareza em algumas especificações técnicas iniciais.',
    'Sobrecarga de tarefas na equipe de detalhamento em semanas críticas.',
  ]
  const lessons = [
    'Sempre validar prazos logísticos com fornecedores antes de fechar o cronograma.',
    'Realizar reuniões de alinhamento técnico mais frequentes (ex: semanais).',
    'Distribuir melhor o pool de tarefas para evitar gargalos em um único projetista.',
  ]
  const plan = [
    'Mapear e homologar fornecedores alternativos para as próximas obras.',
    'Implementar um check-list diário de dúvidas técnicas e bloqueios.',
    'Revisar o cronograma de alocação e esforço da equipe semanalmente.',
  ]

  for (let i = 0; i < 3; i++) {
    const report = new Record(reportsCol)
    report.set('project', projects[i % projects.length].id)
    report.set('positive_points', pos[i])
    report.set('negative_points', neg[i])
    report.set('lessons_learned', lessons[i])
    report.set('corrective_plan', plan[i])
    report.set('created_by', users[0].id)
    report.set('status', statuses[i % 2])
    app.save(report)

    for (let j = 0; j < 2; j++) {
      const action = new Record(actionsCol)
      action.set('apa_report', report.id)
      action.set('description', `Ação de melhoria ${j + 1} para o plano de ação corretiva.`)
      action.set('responsible', users[j % users.length].id)

      const d = new Date()
      d.setDate(d.getDate() + (j + 1) * 7)
      action.set('due_date', d.toISOString())

      action.set('status', actionStatuses[(i + j) % 3])
      app.save(action)
    }
  }
})
