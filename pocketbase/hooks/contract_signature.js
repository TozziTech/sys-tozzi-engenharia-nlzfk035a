routerAdd(
  'POST',
  '/backend/v1/contracts/{id}/send-signature',
  (e) => {
    const id = e.request.pathValue('id')
    const record = $app.findRecordById('generated_contracts', id)

    if (!record.get('client_email')) {
      throw new BadRequestError('E-mail do cliente é obrigatório para assinatura.')
    }

    // Mock external API provider integration (Clicksign / ZapSign)
    const mockLink = 'https://sandbox.zapsign.com.br/sign/mock_' + $security.randomString(8)
    const mockId = 'ext_' + $security.randomString(12)

    record.set('status', 'Enviado para Assinatura')
    record.set('external_id', mockId)
    record.set('signature_link', mockLink)

    $app.save(record)

    return e.json(200, {
      success: true,
      status: 'Enviado para Assinatura',
      signature_link: mockLink,
      external_id: mockId,
    })
  },
  $apis.requireAuth(),
)
