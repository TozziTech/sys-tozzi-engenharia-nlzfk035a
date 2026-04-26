onRecordUpdateRequest((e) => {
  const record = e.record
  const original = record.original()
  const oldAnexos = original.getStringSlice('anexos')
  const newAnexos = record.getStringSlice('anexos')

  const removed = oldAnexos.filter((a) => !newAnexos.includes(a))

  if (removed.length > 0) {
    let isConcluido = false
    let projectId = original.getString('projeto_interno_id')
    if (projectId) {
      try {
        const p = $app.findRecordById('projects', projectId)
        if (p.getString('status') === 'Concluído') isConcluido = true
      } catch (_) {}
    } else {
      projectId = original.getString('projeto_id')
      if (projectId) {
        try {
          const p = $app.findRecordById('projetos_cliente', projectId)
          if (p.getString('status_geral') === 'Concluído') isConcluido = true
        } catch (_) {}
      }
    }

    const createdStr = original.getString('created')
    let isOlderThan24h = false
    if (createdStr) {
      const createdDate = new Date(createdStr.replace(' ', 'T'))
      isOlderThan24h = Date.now() - createdDate.getTime() > 24 * 60 * 60 * 1000
    }

    if (isConcluido || isOlderThan24h) {
      throw new ForbiddenError(
        'Não é permitido remover anexos de projetos concluídos ou após 24 horas da criação do comentário.',
      )
    }
  }
  e.next()
}, 'comentarios_projeto')
