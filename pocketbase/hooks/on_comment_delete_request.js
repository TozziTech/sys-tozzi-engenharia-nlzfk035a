onRecordDeleteRequest((e) => {
  const original = e.record
  const oldAnexos = original.getStringSlice('anexos')

  if (oldAnexos.length > 0) {
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
        'Não é permitido excluir comentários com anexos em projetos concluídos ou após 24 horas da criação.',
      )
    }
  }
  e.next()
}, 'comentarios_projeto')
