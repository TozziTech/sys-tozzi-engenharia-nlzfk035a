migrate(
  (app) => {
    const projetos = new Collection({
      name: 'projetos_cliente',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'nome_projeto', type: 'text', required: true },
        { name: 'descricao_escopo', type: 'text' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_previsao_entrega', type: 'date' },
        {
          name: 'status_geral',
          type: 'select',
          values: ['Planejamento', 'Em Execução', 'Concluído'],
          maxSelect: 1,
        },
        { name: 'progresso_total', type: 'number' },
        { name: 'equipe_responsaveis', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(projetos)

    const fases = new Collection({
      name: 'fases_projeto',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'projeto_id',
          type: 'relation',
          required: true,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        { name: 'nome_fase', type: 'text', required: true },
        { name: 'ordem', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Em Andamento', 'Concluído'],
          maxSelect: 1,
        },
        { name: 'progresso', type: 'number' },
        { name: 'icone', type: 'text' },
        { name: 'data_conclusao_estimada', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(fases)

    const comentarios = new Collection({
      name: 'comentarios_projeto',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'Administrador')",
      deleteRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'Administrador')",
      fields: [
        {
          name: 'projeto_id',
          type: 'relation',
          required: true,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        {
          name: 'autor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(comentarios)

    const pagamentos = new Collection({
      name: 'pagamentos_projeto',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'projeto_id',
          type: 'relation',
          required: true,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'valor', type: 'number' },
        { name: 'data_vencimento', type: 'date' },
        { name: 'status', type: 'select', values: ['Pendente', 'Pago', 'Atrasado'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(pagamentos)

    const documentos = new Collection({
      name: 'documentos_projeto',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (projeto_id.cliente = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'projeto_id',
          type: 'relation',
          required: true,
          collectionId: projetos.id,
          maxSelect: 1,
        },
        { name: 'nome_arquivo', type: 'text', required: true },
        { name: 'tipo', type: 'text' },
        { name: 'arquivo', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documentos)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('documentos_projeto'))
    app.delete(app.findCollectionByNameOrId('pagamentos_projeto'))
    app.delete(app.findCollectionByNameOrId('comentarios_projeto'))
    app.delete(app.findCollectionByNameOrId('fases_projeto'))
    app.delete(app.findCollectionByNameOrId('projetos_cliente'))
  },
)
