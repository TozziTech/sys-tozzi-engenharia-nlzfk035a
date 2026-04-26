onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const mensagem = record.getString('mensagem')

  if (!mensagem) return e.next()

  const mentionRegex = /@([\w\u00C0-\u017F]+(?: [\w\u00C0-\u017F]+)?)/g
  let match
  const mentions = []
  while ((match = mentionRegex.exec(mensagem)) !== null) {
    mentions.push(match[1].trim())
  }

  if (mentions.length === 0) return e.next()

  const uniqueMentions = [...new Set(mentions)]
  const projectId = record.getString('projeto_interno_id') || record.getString('projeto_id')

  let projectName = 'Projeto'
  try {
    if (record.getString('projeto_interno_id')) {
      projectName = $app.findRecordById('projects', projectId).getString('name')
    } else if (record.getString('projeto_id')) {
      projectName = $app.findRecordById('projetos_cliente', projectId).getString('nome_projeto')
    }
  } catch (_) {}

  let authorName = 'Usuário'
  try {
    authorName = $app.findRecordById('users', record.getString('autor')).getString('name')
  } catch (_) {}

  const fiveMinsAgoDate = new Date(Date.now() - 5 * 60 * 1000)
  const isoStr = fiveMinsAgoDate.toISOString()
  const fiveMinsAgo = isoStr.replace('T', ' ').substring(0, 19)

  for (const name of uniqueMentions) {
    try {
      const user = $app.findFirstRecordByFilter('users', 'name = {:name}', { name })
      if (!user || user.id === record.getString('autor')) continue

      const email = user.getString('email')
      if (!email) continue

      let isActive = false
      try {
        const presence = $app.findFirstRecordByFilter(
          'project_presence',
          'user = {:userId} && project = {:projectId} && updated >= {:time}',
          { userId: user.id, projectId, time: fiveMinsAgo },
        )
        if (presence) isActive = true
      } catch (_) {}

      if (!isActive) {
        try {
          const mailClient = $app.newMailClient()
          const settings = $app.settings()

          const senderAddress = settings.meta.senderAddress || 'noreply@sys-tozzi.com'
          const senderName = settings.meta.senderName || 'SyS-TOZZI'
          const appUrl = settings.meta.appUrl || 'https://sys-tozzi.com'
          const link = `${appUrl}/projects/${projectId}`

          const message = new MailerMessage({
            from: { address: senderAddress, name: senderName },
            to: [{ address: email }],
            subject: `Você foi mencionado no projeto: ${projectName}`,
            html: `<p>Olá ${user.getString('name')},</p>
                   <p><strong>${authorName}</strong> mencionou você em um comentário no projeto <strong>${projectName}</strong>.</p>
                   <blockquote style="border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #475569; margin: 1rem 0;">
                     <em>"${mensagem}"</em>
                   </blockquote>
                   <br/>
                   <p><a href="${link}">Clique aqui para acessar o projeto</a></p>`,
          })

          mailClient.send(message)
          $app
            .logger()
            .info('Mention email sent via internal mailer', 'user', user.id, 'project', projectId)
        } catch (mailErr) {
          $app.logger().error('Failed to send mention email', 'error', String(mailErr))
        }
      }
    } catch (err) {
      // User not found or other error for this mention
    }
  }

  e.next()
}, 'comentarios_projeto')
