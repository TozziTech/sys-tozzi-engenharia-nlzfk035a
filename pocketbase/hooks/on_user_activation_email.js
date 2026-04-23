onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus === 'Pendente' && newStatus === 'Ativo') {
    const email = e.record.getString('email')
    const name = e.record.getString('name') || 'Usuário'

    try {
      const message = new mailer.Message({
        from: {
          address: $app.settings().meta.senderAddress || 'noreply@tozziengenharia.com',
          name: $app.settings().meta.senderName || 'Tozzi Engenharia',
        },
        to: [{ address: email }],
        subject: 'Sua conta na Tozzi Engenharia foi ativada!',
        html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a;">Olá, ${name}!</h2>
                    <p style="color: #334155; line-height: 1.6;">Sua conta no sistema <strong>Tozzi Engenharia</strong> foi aprovada e ativada com sucesso.</p>
                    <p style="color: #334155; line-height: 1.6;">Você já pode acessar a plataforma utilizando o seu e-mail e a senha provisória informada no cadastro.</p>
                    <p style="color: #334155; line-height: 1.6;">No seu primeiro acesso, o sistema exigirá que você cadastre uma nova senha definitiva por segurança.</p>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${$secrets.get('PB_INSTANCE_URL') || 'https://dashboard-de-projetos-a89c5.goskip.app'}/login" style="background-color: #020617; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Plataforma</a>
                    </div>
                    <br/>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #64748b; font-size: 14px;">Atenciosamente,<br/>Equipe Tozzi Engenharia</p>
                </div>
            `,
      })

      $app.newMailClient().send(message)
      $app.logger().info('Activation email sent', 'email', email)
    } catch (err) {
      $app
        .logger()
        .error('Failed to send activation email', 'email', email, 'error', err.message || err)
    }
  }

  e.next()
}, 'users')
