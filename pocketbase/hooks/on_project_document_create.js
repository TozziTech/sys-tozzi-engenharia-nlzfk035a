onRecordAfterCreateSuccess(
  (e) => {
    const record = e.record
    const auditLogs = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditLogs)

    let userId = e.auth?.id
    if (!userId) {
      try {
        const admin = $app.findFirstRecordByFilter('users', "role = 'Administrador'")
        userId = admin.id
      } catch (err) {}
    }

    if (userId) {
      log.set('user_id', userId)
    }

    log.set('action', 'Documento Adicionado')
    log.set('resource', record.get('name') || record.get('nome_arquivo') || record.id)
    log.set('details', {
      type: { new: record.get('type') || record.get('tipo') || '' },
    })

    $app.save(log)

    // Automate Email on New Document for Client Dashboard
    const projectId = record.getString('projeto_id')
    if (projectId) {
      try {
        const project = $app.findRecordById('projetos_cliente', projectId)
        const clientId = project.getString('cliente')

        if (clientId) {
          const clientUser = $app.findRecordById('users', clientId)
          const clientEmail = clientUser.getString('email')

          if (clientEmail) {
            const projectName = project.getString('nome_projeto')
            const docName = record.getString('nome_arquivo')

            const message = new MailerMessage({
              from: {
                address:
                  $app.settings().meta.senderAddress ||
                  'noreply@dashboard-de-projetos-a89c5.goskip.app',
                name: $app.settings().meta.senderName || 'SyS-TOZZI ENGENHARIA',
              },
              to: [{ address: clientEmail }],
              subject: 'Novidade no seu Projeto: ' + projectName + ' - Novo Documento',
              html:
                '<p>Olá,</p><p>Um novo documento foi adicionado ao projeto <strong>' +
                projectName +
                '</strong>: <strong>' +
                docName +
                '</strong>.</p><p><a href="https://dashboard-de-projetos-a89c5.goskip.app/gestao/painel-cliente">Acesse o Painel do Cliente</a> para visualizar.</p>',
            })

            $app.newMailClient().send(message)
          }
        }
      } catch (emailErr) {
        console.log('Error sending document upload email: ' + emailErr)
      }
    }

    return e.next()
  },
  'project_documents',
  'documentos_projeto',
)
