onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  if (record.getString('status') === 'Realizada' && original.getString('status') !== 'Realizada') {
    try {
      // Helper to run async process without blocking the main event flow
      ;(async () => {
        try {
          // 1. Gather participants
          const participants = record.get('participants') || []
          let emails = []
          for (const p of participants) {
            if (typeof p === 'string' && p.includes('@')) {
              emails.push(p)
            } else if (typeof p === 'string') {
              try {
                const user = $app.findRecordById('users', p)
                if (user && user.getString('email')) {
                  emails.push(user.getString('email'))
                }
              } catch (err) {}
            }
          }

          if (emails.length === 0) {
            $app.logger().warn('No emails found for meeting participants', 'meetingId', record.id)
            return
          }

          // 2. Send Email with HTML minutes
          try {
            const mailer = require('mailer')
            const minutesHtml = record.getString('minutes') || 'Sem conteúdo documentado.'
            const title = record.getString('title')

            for (const email of emails) {
              const message = new mailer.Message({
                from: {
                  address: $app.settings().meta.senderAddress || 'no-reply@sistema.com',
                  name: $app.settings().meta.senderName || 'Sistema de Gestão',
                },
                to: [{ address: email }],
                subject: 'Ata de Reunião: ' + title,
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2>Ata de Reunião</h2>
                  <p>Olá,</p>
                  <p>A reunião <strong>${title}</strong> foi finalizada. Abaixo, você encontrará a ata com as decisões e itens de ação documentados.</p>
                  <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                  <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                    ${minutesHtml}
                  </div>
                  <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                  <p style="color: #666; font-size: 14px;">Atenciosamente,<br>Equipe</p>
                </div>`,
              })
              $app.newMailClient().send(message)
            }
            $app
              .logger()
              .info(
                'Meeting minutes emails sent',
                'meetingId',
                record.id,
                'emails',
                emails.join(', '),
              )
          } catch (err) {
            $app.logger().error('Failed to send meeting minutes email', 'error', String(err))
          }

          // 3. Create Audit Log
          try {
            const auditCol = $app.findCollectionByNameOrId('audit_logs')
            const auditRecord = new Record(auditCol)
            let userId = e.auth?.id
            if (!userId) {
              const superusers = $app.findRecordsByFilter('_superusers', '1=1', '', 1, 0)
              if (superusers.length > 0) userId = superusers[0].id
            }
            if (userId) {
              auditRecord.set('user_id', userId)
              auditRecord.set('action', 'Finalizou e enviou ata')
              auditRecord.set('resource', 'meetings')
              auditRecord.set('details', { meeting_id: record.id, emails_sent: emails })
              $app.save(auditRecord)
            }
          } catch (err) {
            $app
              .logger()
              .error('Failed to create audit log for meeting finalize', 'error', String(err))
          }
        } catch (err) {
          $app
            .logger()
            .error(
              'Error processing meeting finalize',
              'meetingId',
              record.id,
              'error',
              String(err),
            )
        }
      })()
    } catch (err) {
      $app.logger().error('Error loading hook context in meeting finalize', 'error', String(err))
    }
  }
  e.next()
}, 'meetings')
