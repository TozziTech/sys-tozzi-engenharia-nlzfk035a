migrate(
  (app) => {
    const actionsCol = app.findCollectionByNameOrId('apa_actions')

    const reports = app.findRecordsByFilter('apa_reports', '1=1', '-created', 3)
    const users = app.findRecordsByFilter('users', '1=1', '-created', 3)

    if (reports.length === 0 || users.length === 0) return

    const report1 = reports[0].id
    const report2 = reports.length > 1 ? reports[1].id : reports[0].id

    const user1 = users[0].id
    const user2 = users.length > 1 ? users[1].id : users[0].id

    const today = new Date()

    const pastDate = new Date(today)
    pastDate.setDate(today.getDate() - 5)

    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 10)

    const mockActions = [
      {
        apa_report: report1,
        description: 'Implementar novo processo de revisão 3D',
        responsible: user1,
        due_date: pastDate.toISOString().replace('T', ' '),
        status: 'concluída',
        result: 'Processo implementado com sucesso na equipe técnica.',
      },
      {
        apa_report: report1,
        description: 'Revisar cronograma base do projeto X',
        responsible: user2,
        due_date: pastDate.toISOString().replace('T', ' '),
        status: 'concluída',
        result: 'Cronograma ajustado e aprovado pelo cliente na reunião.',
      },
      {
        apa_report: report2,
        description: 'Treinamento da equipe em novo software de cálculo',
        responsible: user1,
        due_date: pastDate.toISOString().replace('T', ' '),
        status: 'em_progresso',
        result: '',
      },
      {
        apa_report: report2,
        description: 'Atualizar templates de documentos de arquitetura',
        responsible: user2,
        due_date: futureDate.toISOString().replace('T', ' '),
        status: 'aberta',
        result: '',
      },
      {
        apa_report: report1,
        description: 'Agendar reunião de alinhamento quinzenal de projetos',
        responsible: user1,
        due_date: futureDate.toISOString().replace('T', ' '),
        status: 'em_progresso',
        result: '',
      },
    ]

    for (const data of mockActions) {
      try {
        const record = new Record(actionsCol)
        record.set('apa_report', data.apa_report)
        record.set('description', data.description)
        record.set('responsible', data.responsible)
        record.set('due_date', data.due_date)
        record.set('status', data.status)
        if (data.result) {
          record.set('result', data.result)
        }
        app.save(record)
      } catch (e) {
        console.log('Error seeding apa_actions:', e)
      }
    }
  },
  (app) => {
    // Revert logic left blank defensively
  },
)
