// @deps pdf-lib@1.17.1
onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  if (record.getString('status') === 'Realizada' && original.getString('status') !== 'Realizada') {
    try {
      const { PDFDocument, StandardFonts } = require('pdf-lib')

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

          // 2. Generate PDF
          const pdfDoc = await PDFDocument.create()
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

          let page = pdfDoc.addPage()
          const { width, height } = page.getSize()
          let y = height - 50

          const drawText = (text, size, isBold = false) => {
            if (y < 50) {
              page = pdfDoc.addPage()
              y = height - 50
            }
            page.drawText(text, { x: 50, y, size, font: isBold ? boldFont : font })
            y -= size + 5
          }

          const charMap = {
            á: 'a',
            à: 'a',
            ã: 'a',
            â: 'a',
            ä: 'a',
            é: 'e',
            è: 'e',
            ê: 'e',
            ë: 'e',
            í: 'i',
            ì: 'i',
            î: 'i',
            ï: 'i',
            ó: 'o',
            ò: 'o',
            õ: 'o',
            ô: 'o',
            ö: 'o',
            ú: 'u',
            ù: 'u',
            û: 'u',
            ü: 'u',
            ç: 'c',
            ñ: 'n',
            Á: 'A',
            À: 'A',
            Ã: 'A',
            Â: 'A',
            Ä: 'A',
            É: 'E',
            È: 'E',
            Ê: 'E',
            Ë: 'E',
            Í: 'I',
            Ì: 'I',
            Î: 'I',
            Ï: 'I',
            Ó: 'O',
            Ò: 'O',
            Õ: 'O',
            Ô: 'O',
            Ö: 'O',
            Ú: 'U',
            Ù: 'U',
            Û: 'U',
            Ü: 'U',
            Ç: 'C',
            Ñ: 'N',
          }

          const sanitizeText = (txt) => {
            return txt
              .replace(/[^\u0000-\u007E]/g, (a) => charMap[a] || '')
              .replace(/[^\x20-\x7E]/g, '')
          }

          drawText('Ata de Reuniao', 20, true)
          y -= 10
          drawText(sanitizeText('Titulo: ' + record.getString('title')), 14, true)
          const dateStr = record.getString('date_time')
          drawText('Data: ' + (dateStr ? dateStr.substring(0, 16).replace('T', ' ') : 'N/A'), 12)
          y -= 20

          const minutesHtml = record.getString('minutes') || 'Sem conteudo documentado.'
          const plainText = sanitizeText(
            minutesHtml
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          )

          const words = plainText.split(' ')
          let line = ''
          for (const word of words) {
            const testLine = line + word + ' '
            if (testLine.length * 6 > width - 100) {
              drawText(line, 12)
              line = word + ' '
            } else {
              line = testLine
            }
          }
          if (line.trim().length > 0) {
            drawText(line, 12)
          }

          const pdfBytes = await pdfDoc.save()

          // 3. Send Email
          try {
            const mailer = require('mailer')
            for (const email of emails) {
              const message = new mailer.Message({
                from: {
                  address: $app.settings().meta.senderAddress || 'no-reply@sistema.com',
                  name: $app.settings().meta.senderName || 'Sistema de Gestão',
                },
                to: [{ address: email }],
                subject: 'Ata de Reunião: ' + record.getString('title'),
                html: `<p>Olá,</p><p>A reunião <strong>${record.getString('title')}</strong> foi finalizada. Em anexo, você encontrará a ata com as decisões e itens de ação.</p><p>Atenciosamente,<br>Equipe</p>`,
                attachments: {
                  'Ata_de_Reuniao.pdf': pdfBytes,
                },
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

          // 4. Create Audit Log
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
      $app.logger().error('Error loading pdf-lib in meeting finalize', 'error', String(err))
    }
  }
  e.next()
}, 'meetings')
