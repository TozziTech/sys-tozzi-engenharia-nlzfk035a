onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== newStatus) {
    try {
      const project = $app.findRecordById('projetos_cliente', e.record.getString('projeto_id'))
      const client = $app.findRecordById('users', project.getString('cliente'))
      const phaseName = e.record.getString('nome_fase')
      const notificationsCol = $app.findCollectionByNameOrId('notifications')

      if (newStatus === 'Aprovado' || newStatus === 'Revisão Solicitada') {
        const admins = $app.findRecordsByFilter('users', "role = 'Administrador'", '', 50, 0)

        for (const admin of admins) {
          const notif = new Record(notificationsCol)
          notif.set('user', admin.id)
          notif.set('title', `Fase ${newStatus}: ${phaseName}`)
          notif.set(
            'message',
            `O cliente ${client.getString('name')} marcou a fase como ${newStatus}. ${newStatus === 'Revisão Solicitada' ? 'Feedback: ' + e.record.getString('feedback_revisao') : ''}`,
          )
          notif.set('link', `/gestao/painel-cliente/${project.id}`)
          notif.set('is_important', true)
          notif.set('read', false)
          $app.save(notif)
        }
      } else if (newStatus === 'Aguardando Aprovação') {
        const notif = new Record(notificationsCol)
        notif.set('user', client.id)
        notif.set('title', `Aprovação Necessária: ${phaseName}`)
        notif.set(
          'message',
          `A fase "${phaseName}" foi concluída pela nossa equipe e está aguardando sua aprovação no painel.`,
        )
        notif.set('link', `/gestao/painel-cliente/${project.id}`)
        notif.set('is_important', true)
        notif.set('action_type', 'approve_phase')
        notif.set('action_payload', e.record.id)
        notif.set('read', false)
        $app.save(notif)
      }
    } catch (err) {
      console.log('Error in on_approval_update hook:', err)
    }
  }

  e.next()
}, 'fases_projeto')
