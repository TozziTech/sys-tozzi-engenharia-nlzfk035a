migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
    } catch (_) {
      return
    }

    try {
      app.findFirstRecordByData('projetos_cliente', 'cliente', user.id)
      return
    } catch (_) {}

    const projetosCol = app.findCollectionByNameOrId('projetos_cliente')
    const projeto = new Record(projetosCol)
    projeto.set('cliente', user.id)
    projeto.set('nome_projeto', 'Residência Unifamiliar - Lote 12')
    projeto.set(
      'descricao_escopo',
      'Construção de uma residência unifamiliar de alto padrão com 350m², incluindo fundação, superestrutura, instalações hidrossanitárias, elétricas e acabamentos premium. O projeto contempla também área de lazer com piscina e espaço gourmet.',
    )
    projeto.set('data_inicio', '2026-03-01 10:00:00.000Z')
    projeto.set('data_previsao_entrega', '2026-12-20 18:00:00.000Z')
    projeto.set('status_geral', 'Em Execução')
    projeto.set('progresso_total', 65)
    projeto.set('equipe_responsaveis', [
      {
        id: 1,
        name: 'Eng. Samuel',
        role: 'Estrutural',
        avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
      },
      {
        id: 2,
        name: 'Arq. Tozzi',
        role: 'Arquitetura',
        avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
      },
    ])
    app.save(projeto)

    const fasesCol = app.findCollectionByNameOrId('fases_projeto')
    const fases = [
      {
        nome_fase: 'Projeto',
        ordem: 1,
        status: 'Concluído',
        progresso: 100,
        icone: 'FileText',
        data_conclusao_estimada: '2026-02-28 00:00:00.000Z',
      },
      {
        nome_fase: 'Estrutura',
        ordem: 2,
        status: 'Em Andamento',
        progresso: 50,
        icone: 'Building2',
        data_conclusao_estimada: '2026-11-15 00:00:00.000Z',
      },
      {
        nome_fase: 'Hidrossanitário',
        ordem: 3,
        status: 'Pendente',
        progresso: 0,
        icone: 'Droplets',
        data_conclusao_estimada: '2026-11-30 00:00:00.000Z',
      },
      {
        nome_fase: 'Elétrico',
        ordem: 4,
        status: 'Pendente',
        progresso: 0,
        icone: 'Zap',
        data_conclusao_estimada: '2026-12-05 00:00:00.000Z',
      },
      {
        nome_fase: 'Acabamento',
        ordem: 5,
        status: 'Pendente',
        progresso: 0,
        icone: 'Paintbrush',
        data_conclusao_estimada: '2026-12-20 00:00:00.000Z',
      },
    ]

    for (const f of fases) {
      const record = new Record(fasesCol)
      record.set('projeto_id', projeto.id)
      record.set('nome_fase', f.nome_fase)
      record.set('ordem', f.ordem)
      record.set('status', f.status)
      record.set('progresso', f.progresso)
      record.set('icone', f.icone)
      record.set('data_conclusao_estimada', f.data_conclusao_estimada)
      app.save(record)
    }

    const pagamentosCol = app.findCollectionByNameOrId('pagamentos_projeto')
    const pagamentos = [
      {
        descricao: 'Sinal - Início do Projeto',
        valor: 85000,
        data_vencimento: '2026-03-01 00:00:00.000Z',
        status: 'Pago',
      },
      {
        descricao: '1ª Parcela - Fundação',
        valor: 150000,
        data_vencimento: '2026-04-05 00:00:00.000Z',
        status: 'Pago',
      },
      {
        descricao: '2ª Parcela - Estrutura',
        valor: 200000,
        data_vencimento: '2026-06-10 00:00:00.000Z',
        status: 'Pago',
      },
      {
        descricao: '3ª Parcela - Alvenaria',
        valor: 150000,
        data_vencimento: '2026-08-15 00:00:00.000Z',
        status: 'Pendente',
      },
      {
        descricao: 'Taxa Extra - Modificação',
        valor: 15000,
        data_vencimento: '2026-08-01 00:00:00.000Z',
        status: 'Atrasado',
      },
    ]

    for (const p of pagamentos) {
      const record = new Record(pagamentosCol)
      record.set('projeto_id', projeto.id)
      record.set('descricao', p.descricao)
      record.set('valor', p.valor)
      record.set('data_vencimento', p.data_vencimento)
      record.set('status', p.status)
      app.save(record)
    }

    const docsCol = app.findCollectionByNameOrId('documentos_projeto')
    const documentos = [
      { nome_arquivo: 'Projeto Arquitetônico Executivo - Rev 03.pdf', tipo: 'Arquitetura' },
      { nome_arquivo: 'Projeto Estrutural.pdf', tipo: 'Estrutural' },
    ]
    for (const d of documentos) {
      const record = new Record(docsCol)
      record.set('projeto_id', projeto.id)
      record.set('nome_arquivo', d.nome_arquivo)
      record.set('tipo', d.tipo)
      app.save(record)
    }

    const comentariosCol = app.findCollectionByNameOrId('comentarios_projeto')
    const c1 = new Record(comentariosCol)
    c1.set('projeto_id', projeto.id)
    c1.set('autor', user.id)
    c1.set(
      'mensagem',
      'Muito bom o andamento da estrutura! Gostaria de saber se a concretagem da laje será na próxima semana.',
    )
    app.save(c1)

    const c2 = new Record(comentariosCol)
    c2.set('projeto_id', projeto.id)
    c2.set('autor', user.id)
    c2.set('mensagem', 'Aguardando o envio do projeto de interiores para validação.')
    app.save(c2)
  },
  (app) => {
    const db = app.db()
    db.newQuery('DELETE FROM comentarios_projeto').execute()
    db.newQuery('DELETE FROM documentos_projeto').execute()
    db.newQuery('DELETE FROM pagamentos_projeto').execute()
    db.newQuery('DELETE FROM fases_projeto').execute()
    db.newQuery('DELETE FROM projetos_cliente').execute()
  },
)
