migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contract_clauses')

    const seeds = [
      {
        name: 'Foro de Eleição',
        category: 'Jurídico',
        content:
          '<p>Fica eleito o foro da Comarca de <strong>[CIDADE]</strong>, Estado de <strong>[ESTADO]</strong>, para dirimir quaisquer dúvidas ou litígios oriundos do presente contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.</p>',
      },
      {
        name: 'Confidencialidade',
        category: 'Segurança',
        content:
          '<p>As partes comprometem-se a manter sob absoluto sigilo todas as informações, dados, documentos e materiais técnicos ou comerciais a que tiverem acesso por força deste contrato, não podendo revelá-los a terceiros sem prévia e expressa autorização por escrito da outra parte.</p>',
      },
      {
        name: 'Rescisão Contratual',
        category: 'Condições Gerais',
        content:
          '<p>O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias, sem que caiba qualquer indenização, ressalvados os pagamentos devidos pelos serviços já prestados até a data da efetiva rescisão.</p>',
      },
    ]

    for (const seed of seeds) {
      try {
        app.findFirstRecordByData('contract_clauses', 'name', seed.name)
        continue
      } catch (_) {
        const record = new Record(col)
        record.set('name', seed.name)
        record.set('category', seed.category)
        record.set('content', seed.content)
        app.save(record)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contract_clauses')
    const names = ['Foro de Eleição', 'Confidencialidade', 'Rescisão Contratual']
    for (const name of names) {
      try {
        const record = app.findFirstRecordByData('contract_clauses', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
