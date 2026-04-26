onRecordAfterCreateSuccess((e) => {
  const isImportant = e.record.getBool('is_important')
  const actionType = e.record.getString('action_type')

  if (isImportant || actionType === 'deadline_alert') {
    try {
      const user = $app.findRecordById('users', e.record.getString('user'))

      const emailEnabled = user.get('email_notifications_enabled')
      if (emailEnabled === false) {
        return e.next() // User opted out of emails
      }

      const email = user.getString('email')

      if (email) {
        let title = e.record.getString('title')
        const messageText = e.record.getString('message')
        const link = e.record.getString('link')
        const baseUrl = $secrets.get('PB_INSTANCE_URL') || ''
        const fullLink = link.startsWith('http') ? link : baseUrl + link

        const payload = e.record.getString('action_payload') || ''
        let subject = `Notificação: ${title}`
        let color = '#2563eb' // default blue
        let headerBg = '#f3f4f6'

        if (actionType === 'deadline_alert') {
          const parts = payload.split(':')
          const alertType = parts.length > 1 ? parts[1] : ''

          let moduleName = 'Módulo'
          try {
            if (parts[0]) {
              const mod = $app.findRecordById('project_modules', parts[0])
              moduleName = mod.getString('name')
            }
          } catch (_) {}

          if (alertType === 'overdue') {
            subject = `[ATRASO] Prazo expirado - ${moduleName}`
            color = '#ef4444' // red
            headerBg = '#fef2f2'
          } else if (alertType === 'today') {
            subject = `[URGENTE] Prazo de entrega hoje - ${moduleName}`
            color = '#f59e0b' // yellow
            headerBg = '#fffbeb'
          } else {
            const days = alertType.replace('_days', '')
            subject = `[AVISO] Entrega em ${days} dia(s) - ${moduleName}`
            color = '#3b82f6' // blue
            headerBg = '#eff6ff'
          }
        } else {
          subject = `Notificação Importante: ${title}`
        }

        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
          },
          to: [{ address: email }],
          subject: subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background-color: ${headerBg}; padding: 20px; border-bottom: 2px solid ${color}; text-align: center;">
                <h2 style="color: ${color}; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">${title}</h2>
              </div>
              <div style="padding: 30px 20px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-top: 0;">Olá <strong>${user.getString('name') || 'Usuário'}</strong>,</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.5; background-color: #f9fafb; padding: 15px; border-left: 4px solid ${color}; border-radius: 4px;">
                  ${messageText}
                </p>
                <div style="margin-top: 30px; text-align: center;">
                  <a href="${fullLink}" style="background-color: ${color}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar no Sistema</a>
                </div>
              </div>
              <div style="background-color: #f9fafb; padding: 15px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Esta é uma mensagem automática do sistema.<br/>
                  Para alterar suas preferências de notificação, acesse <strong>Meu Painel &gt; Configurações de Alerta</strong>.
                </p>
              </div>
            </div>
          `,
        })

        $app.newMailClient().send(message)
      }
    } catch (err) {
      console.log('Error sending email alert:', err)
    }
  }

  e.next()
}, 'notifications')
