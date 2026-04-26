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

    const collectionName = e.collection.name

    // New Logic: Notify Admins & PMs for internal project documents
    if (collectionName === 'project_documents') {
      const internalProjectId = record.getString('project')
      if (internalProjectId) {
        try {
          const project = $app.findRecordById('projects', internalProjectId)
          const projectName = project.getString('name') || 'Projeto'
          const docName = record.getString('name') || 'Documento'

          const managers = $app.findRecordsByFilter(
            'users',
            "role = 'Gerente de Projeto' || role = 'Administrador'",
            '',
            1000,
            0,
          )
          const uploaderId = e.auth?.id

          const isUrgent = record.getBool('is_urgent')

          for (let i = 0; i < managers.length; i++) {
            const mgr = managers[i]
            if (mgr.id === uploaderId) continue

            const notif = new Record($app.findCollectionByNameOrId('notifications'))
            notif.set('user', mgr.id)
            notif.set(
              'title',
              isUrgent ? '🚨 URGENTE: Novo Arquivo Carregado' : 'Novo Arquivo Carregado',
            )
            notif.set(
              'message',
              'O arquivo ' +
                docName +
                ' foi carregado no projeto ' +
                projectName +
                '.' +
                (isUrgent ? ' Este documento foi marcado como URGENTE.' : ''),
            )
            notif.set('link', '/projects/' + internalProjectId)
            notif.set('read', false)
            notif.set('is_important', isUrgent)
            $app.save(notif)
          }
        } catch (err) {
          console.log('Error creating PM notifications: ' + err)
        }
      }
    }

    // Automate Email on New Document for Client Dashboard
    const projectId = record.getString('projeto_id')
    if (projectId && collectionName === 'documentos_projeto') {
      try {
        const project = $app.findRecordById('projetos_cliente', projectId)
        const clientId = project.getString('cliente')

        if (clientId) {
          const clientUser = $app.findRecordById('users', clientId)
          const clientEmail = clientUser.getString('email')
          const projectName = project.getString('nome_projeto') || 'Projeto'
          const docName =
            record.getString('nome_arquivo') || record.getString('name') || 'Documento'

          try {
            const notif = new Record($app.findCollectionByNameOrId('notifications'))
            notif.set('user', clientId)
            notif.set('title', 'Novo Documento')
            notif.set(
              'message',
              'Um novo documento (' + docName + ') foi adicionado ao projeto ' + projectName + '.',
            )
            notif.set('read', false)
            notif.set('link', '/gestao/painel-cliente')
            $app.save(notif)
          } catch (notifErr) {
            console.log('Error creating notification: ' + notifErr)
          }

          if (clientEmail) {
            const clientName = clientUser.getString('name') || 'Cliente'

            let settings = null
            try {
              settings = $app.findFirstRecordByFilter('company_settings', "id != ''")
            } catch (err) {}

            let logoUrl = ''
            let primaryColor = '#2563eb'
            let companyName = 'SyS-TOZZI ENGENHARIA'

            if (settings) {
              const logo = settings.getString('logo')
              if (logo) {
                logoUrl =
                  'https://dashboard-de-projetos-a89c5.goskip.app/api/files/company_settings/' +
                  settings.id +
                  '/' +
                  logo
              }
              const color = settings.getString('primary_color')
              if (color) primaryColor = color
              const name = settings.getString('company_name')
              if (name) companyName = name
            }

            const dashboardUrl =
              'https://dashboard-de-projetos-a89c5.goskip.app/gestao/painel-cliente'
            const currentYear = new Date().getFullYear()

            const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novo documento disponível: ${docName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
  .logo { max-width: 180px; max-height: 80px; }
  .content { padding: 32px 0; color: #374151; line-height: 1.625; text-align: center; }
  .heading { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; margin-top: 0; }
  .message { font-size: 16px; margin-bottom: 32px; }
  .button-container { text-align: center; margin-top: 32px; margin-bottom: 16px; }
  .button { display: inline-block; padding: 12px 28px; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: opacity 0.2s; }
  .button:hover { opacity: 0.9; }
  .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : `<h2 style="margin:0;color:#111827;">${companyName}</h2>`}
    </div>
    <div class="content">
      <h1 class="heading">Novo documento disponível: ${docName}</h1>
      <p class="message">Olá, ${clientName},</p>
      <p class="message">Um novo documento (<strong>${docName}</strong>) foi adicionado ao projeto <strong>${projectName}</strong>.</p>
      <div class="button-container">
        <a href="${dashboardUrl}" class="button">Ver Novo Documento</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} ${companyName}. Todos os direitos reservados.<br>
      Esta é uma notificação automática, por favor não responda a este e-mail.
    </div>
  </div>
</body>
</html>`

            const textContent = `Olá, ${clientName},\n\nUm novo documento (${docName}) foi adicionado ao projeto "${projectName}".\n\nVer Novo Documento:\n${dashboardUrl}\n\nEsta é uma notificação automática, por favor não responda a este e-mail.\n\n${companyName}`

            const message = new MailerMessage({
              from: {
                address:
                  $app.settings().meta.senderAddress ||
                  'noreply@dashboard-de-projetos-a89c5.goskip.app',
                name: $app.settings().meta.senderName || companyName,
              },
              to: [{ address: clientEmail }],
              subject: 'Novidade no seu Projeto: ' + projectName + ' - Novo Documento',
              html: htmlContent,
              text: textContent,
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
