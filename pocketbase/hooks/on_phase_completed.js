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

        // Automate Email on Phase Completion
        try {
          const clientUser = $app.findRecordById('users', clientId)
          const clientEmail = clientUser.getString('email')

          if (clientEmail) {
            const projectName = project.getString('nome_projeto')
            const phaseName = phase.getString('nome_fase')

            const message = new MailerMessage({
              from: {
                address:
                  $app.settings().meta.senderAddress ||
                  'noreply@dashboard-de-projetos-a89c5.goskip.app',
                name: $app.settings().meta.senderName || 'SyS-TOZZI ENGENHARIA',
              },
              to: [{ address: clientEmail }],
              subject: 'Novidade no seu Projeto: ' + projectName + ' - Etapa Concluída',
              html:
                '<p>Olá,</p><p>A fase <strong>' +
                phaseName +
                '</strong> do projeto <strong>' +
                projectName +
                '</strong> foi finalizada.</p><p><a href="https://dashboard-de-projetos-a89c5.goskip.app/gestao/painel-cliente">Acesse o Painel do Cliente</a> para conferir mais detalhes.</p>',
            })

            $app.newMailClient().send(message)
          }
        } catch (emailErr) {
          console.log('Error sending phase completion email: ' + emailErr)
        }
      }
    }
  } catch (err) {
    console.log('Error in on_phase_completed hook: ' + err)
  }
  return e.next()
}, 'fases_projeto')
