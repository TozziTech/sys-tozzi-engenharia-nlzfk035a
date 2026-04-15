onRecordAfterCreateSuccess((e) => {
  if (e.record.getBool('is_important')) {
    try {
      const user = $app.findRecordById('users', e.record.getString('user'))
      const email = user.getString('email')

      if (email) {
        const title = e.record.getString('title')
        const messageText = e.record.getString('message')
        const link = e.record.getString('link')
        const baseUrl = $secrets.get('PB_INSTANCE_URL') || ''
        const fullLink = link.startsWith('http') ? link : baseUrl + link

        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName,
          },
          to: [{ address: email }],
          subject: `Notificação Importante: ${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #111827; margin-top: 0;">${title}</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.5;">Olá ${user.getString('name') || 'Usuário'},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.5;">${messageText}</p>
              <div style="margin-top: 30px; text-align: center;">
                <a href="${fullLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver no Sistema</a>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
                Esta é uma mensagem automática, por favor não responda.
              </p>
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
