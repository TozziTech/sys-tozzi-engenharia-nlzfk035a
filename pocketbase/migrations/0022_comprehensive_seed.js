migrate(
  (app) => {
    // 1. Seed Users
    const usersCol = app.findCollectionByNameOrId('users')
    const roles = [
      { email: 'admin@tozzi.com', role: 'Administrador', name: 'Admin Tozzi', cod: 'ADM01' },
      {
        email: 'gerente@tozzi.com',
        role: 'Gerente de Projeto',
        name: 'Gerente Silva',
        cod: 'GER01',
      },
      {
        email: 'projetista@tozzi.com',
        role: 'Projetista',
        name: 'Projetista Costa',
        cod: 'PROJ01',
      },
      { email: 'estagiario@tozzi.com', role: 'Estagiário', name: 'Estagiário Lima', cod: 'EST01' },
      { email: 'visitante@tozzi.com', role: 'Visitante', name: 'Visitante Souza', cod: 'VIS01' },
    ]

    const createdUsers = {}
    for (const r of roles) {
      try {
        const existing = app.findAuthRecordByEmail('users', r.email)
        createdUsers[r.role] = existing.id
      } catch (_) {
        const record = new Record(usersCol)
        record.setEmail(r.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('role', r.role)
        record.set('name', r.name)
        record.set('codigo', r.cod)
        record.set('status', 'Ativo')
        app.save(record)
        createdUsers[r.role] = record.id
      }
    }

    // 2. Seed Clients
    const clientsCol = app.findCollectionByNameOrId('clients')
    const clients = [
      {
        name: 'Construtora Alpha',
        email: 'contato@alpha.com',
        phone: '11999999999',
        cnpj_cpf: '00.000.000/0001-00',
      },
      {
        name: 'Engenharia Beta',
        email: 'contato@beta.com',
        phone: '11888888888',
        cnpj_cpf: '11.111.111/0001-11',
      },
    ]
    for (const c of clients) {
      try {
        app.findFirstRecordByData('clients', 'name', c.name)
      } catch (_) {
        const record = new Record(clientsCol)
        record.set('name', c.name)
        record.set('email', c.email)
        record.set('phone', c.phone)
        record.set('cnpj_cpf', c.cnpj_cpf)
        app.save(record)
      }
    }

    // 3. Seed Projects
    const projectsCol = app.findCollectionByNameOrId('projects')
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)

    const formatDate = (d) => d.toISOString().split('T')[0] + ' 12:00:00.000Z'

    const projects = [
      {
        name: 'Edifício Infinity',
        client: 'Construtora Alpha',
        discipline: 'Estrutural',
        status: 'Em Andamento',
        progress: 45,
        engineer: 'Projetista Costa',
        budget: 150000,
        spent: 60000,
        start_date: formatDate(lastMonth),
        end_date: formatDate(nextMonth),
      },
      {
        name: 'Condomínio Horizonte',
        client: 'Engenharia Beta',
        discipline: 'Hidrossanitário',
        status: 'Concluído',
        progress: 100,
        engineer: 'Admin Tozzi',
        budget: 80000,
        spent: 75000,
        start_date: formatDate(lastMonth),
        end_date: formatDate(today),
      },
      {
        name: 'Residencial Parque',
        client: 'Construtora Alpha',
        discipline: 'Elétrico',
        status: 'Atrasado',
        progress: 80,
        engineer: 'Projetista Costa',
        budget: 50000,
        spent: 55000,
        start_date: formatDate(lastMonth),
        end_date: formatDate(lastMonth),
      },
      {
        name: 'Galpão Logístico',
        client: 'Engenharia Beta',
        discipline: 'Prevenção a Incêndio',
        status: 'Planejamento',
        progress: 0,
        engineer: 'Gerente Silva',
        budget: 120000,
        spent: 0,
        start_date: formatDate(nextMonth),
        end_date: formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
      },
      {
        name: 'Shopping Center Sul',
        client: 'Construtora Alpha',
        discipline: 'Arquitetura',
        status: 'Em Andamento',
        progress: 15,
        engineer: 'Projetista Costa',
        budget: 300000,
        spent: 20000,
        start_date: formatDate(today),
        end_date: formatDate(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)),
      },
    ]

    const createdProjects = []
    for (const p of projects) {
      try {
        const existing = app.findFirstRecordByData('projects', 'name', p.name)
        createdProjects.push(existing)
      } catch (_) {
        const record = new Record(projectsCol)
        record.set('name', p.name)
        record.set('client', p.client)
        record.set('discipline', p.discipline)
        record.set('status', p.status)
        record.set('progress', p.progress)
        record.set('engineer', p.engineer)
        record.set('budget', p.budget)
        record.set('spent', p.spent)
        record.set('start_date', p.start_date)
        record.set('end_date', p.end_date)
        app.save(record)
        createdProjects.push(record)
      }
    }

    // 4. Seed Tasks
    const tasksCol = app.findCollectionByNameOrId('tasks')
    if (createdProjects.length >= 2) {
      const p1 = createdProjects[0]
      const p2 = createdProjects[1]

      const tasks = [
        { title: 'Levantamento inicial', status: 'Concluído', project: p1.id },
        { title: 'Cálculo de cargas', status: 'Em Andamento', project: p1.id },
        { title: 'Detalhamento de vigas', status: 'A Fazer', project: p1.id },
        { title: 'Revisão final', status: 'A Fazer', project: p1.id },
        { title: 'Aprovação do cliente', status: 'A Fazer', project: p1.id },
        { title: 'Projeto base', status: 'Concluído', project: p2.id },
        { title: 'Dimensionamento de tubulações', status: 'Concluído', project: p2.id },
        { title: 'Planta de isométricas', status: 'Concluído', project: p2.id },
        { title: 'Lista de materiais', status: 'Concluído', project: p2.id },
        { title: 'Entrega do as-built', status: 'Concluído', project: p2.id },
      ]

      for (const t of tasks) {
        try {
          app.findFirstRecordByData('tasks', 'title', t.title)
        } catch (_) {
          const record = new Record(tasksCol)
          record.set('title', t.title)
          record.set('status', t.status)
          record.set('project', t.project)
          app.save(record)
        }
      }
    }

    // 5. Seed Financial Records
    const finCol = app.findCollectionByNameOrId('financial_records')
    const fins = [
      {
        description: 'Sinal Edifício Infinity',
        amount: 50000,
        type: 'Receita',
        category: 'Serviços',
        date: formatDate(lastMonth),
      },
      {
        description: 'Licença de Software CAD',
        amount: 5000,
        type: 'Despesa',
        category: 'Software',
        date: formatDate(lastMonth),
      },
      {
        description: 'Parcela 1 Condomínio Horizonte',
        amount: 40000,
        type: 'Receita',
        category: 'Serviços',
        date: formatDate(today),
      },
      {
        description: 'Aluguel Escritório',
        amount: 3500,
        type: 'Despesa',
        category: 'Infraestrutura',
        date: formatDate(today),
      },
    ]
    for (const f of fins) {
      try {
        app.findFirstRecordByData('financial_records', 'description', f.description)
      } catch (_) {
        const record = new Record(finCol)
        record.set('description', f.description)
        record.set('amount', f.amount)
        record.set('type', f.type)
        record.set('category', f.category)
        record.set('date', f.date)
        app.save(record)
      }
    }

    // 6. Seed Equipments & Loans
    const equipCol = app.findCollectionByNameOrId('equipments')
    const equips = [
      {
        name: 'Estação Total Leica',
        category: 'Topografia',
        status: 'Disponível',
        condition: 'Bom',
      },
      {
        name: 'Notebook Dell Precision',
        category: 'Informática',
        status: 'Em Uso',
        condition: 'Novo',
      },
    ]
    const createdEquips = []
    for (const e of equips) {
      try {
        const existing = app.findFirstRecordByData('equipments', 'name', e.name)
        createdEquips.push(existing)
      } catch (_) {
        const record = new Record(equipCol)
        record.set('name', e.name)
        record.set('category', e.category)
        record.set('status', e.status)
        record.set('condition', e.condition)
        app.save(record)
        createdEquips.push(record)
      }
    }

    const loanCol = app.findCollectionByNameOrId('equipment_loans')
    if (createdEquips.length > 0 && createdUsers['Projetista']) {
      try {
        app.findFirstRecordByData('equipment_loans', 'equipment_id', createdEquips[1].id)
      } catch (_) {
        const record = new Record(loanCol)
        record.set('equipment_id', createdEquips[1].id)
        record.set('user_id', createdUsers['Projetista'])
        record.set('loan_date', formatDate(today))
        record.set('status', 'Ativo')
        app.save(record)
      }
    }

    // 7. Audit Logs
    const auditCol = app.findCollectionByNameOrId('audit_logs')
    try {
      app.findFirstRecordByData('audit_logs', 'action', 'CREATE_SEED')
    } catch (_) {
      if (createdUsers['Administrador']) {
        const record = new Record(auditCol)
        record.set('user_id', createdUsers['Administrador'])
        record.set('action', 'CREATE_SEED')
        record.set('resource', 'system')
        record.set('details', JSON.stringify({ message: 'Seed data initialized' }))
        app.save(record)
      }
    }
  },
  (app) => {
    const deleteByField = (collection, field, value) => {
      try {
        const record = app.findFirstRecordByData(collection, field, value)
        app.delete(record)
      } catch (_) {}
    }

    const deleteAuth = (email) => {
      try {
        const record = app.findAuthRecordByEmail('users', email)
        app.delete(record)
      } catch (_) {}
    }

    deleteAuth('admin@tozzi.com')
    deleteAuth('gerente@tozzi.com')
    deleteAuth('projetista@tozzi.com')
    deleteAuth('estagiario@tozzi.com')
    deleteAuth('visitante@tozzi.com')

    deleteByField('clients', 'name', 'Construtora Alpha')
    deleteByField('clients', 'name', 'Engenharia Beta')

    deleteByField('projects', 'name', 'Edifício Infinity')
    deleteByField('projects', 'name', 'Condomínio Horizonte')
    deleteByField('projects', 'name', 'Residencial Parque')
    deleteByField('projects', 'name', 'Galpão Logístico')
    deleteByField('projects', 'name', 'Shopping Center Sul')

    deleteByField('financial_records', 'description', 'Sinal Edifício Infinity')
    deleteByField('financial_records', 'description', 'Licença de Software CAD')
    deleteByField('financial_records', 'description', 'Parcela 1 Condomínio Horizonte')
    deleteByField('financial_records', 'description', 'Aluguel Escritório')

    deleteByField('equipments', 'name', 'Estação Total Leica')
    deleteByField('equipments', 'name', 'Notebook Dell Precision')

    app
      .db()
      .newQuery(
        "DELETE FROM tasks WHERE title IN ('Levantamento inicial', 'Cálculo de cargas', 'Detalhamento de vigas', 'Revisão final', 'Aprovação do cliente', 'Projeto base', 'Dimensionamento de tubulações', 'Planta de isométricas', 'Lista de materiais', 'Entrega do as-built')",
      )
      .execute()
  },
)
