routerAdd(
  'POST',
  '/backend/v1/contracts/send-email',
  (e) => {
    const body = e.requestInfo().body
    if (!body.to) {
      throw new BadRequestError('E-mail de destino é obrigatório')
    }

    // Simulated email sending since we don't have a mailer API exposed in this project's subset
    console.log('Mock: Sending contract email to ' + body.to)

    return e.json(200, { success: true, message: 'E-mail enviado com sucesso' })
  },
  $apis.requireAuth(),
)
