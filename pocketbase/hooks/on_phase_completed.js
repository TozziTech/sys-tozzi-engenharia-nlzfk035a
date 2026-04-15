onRecordAfterUpdateSuccess((e) => {
  try {
    const phase = e.record
    const oldPhase = phase.original()

    if (phase.getString('status') === 'Concluído' && oldPhase.getString('status') !== 'Concluído') {
      const projectId = phase.getString('projeto_id')
      if (!projectId) return e.next()

      const project = $app.findRecordById('projetos_cliente', projectId)
      const clientId = project.getString('cliente')

      if (clientId) {
        const notif = new Record($app.findCollectionByNameOrId('notifications'))
        notif.set('user', clientId)
        notif.set('title', 'Marco Concluído!')
        notif.set(
          'message',
          "A fase '" + phase.getString('nome_fase') + "' foi concluída com sucesso.",
        )
        notif.set('read', false)
        notif.set('link', '/gestao/painel-cliente')

        $app.save(notif)
      }
    }
  } catch (err) {
    console.log('Error in on_phase_completed hook: ' + err)
  }
  return e.next()
}, 'fases_projeto')
