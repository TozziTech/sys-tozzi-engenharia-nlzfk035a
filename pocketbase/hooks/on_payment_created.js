onRecordAfterCreateSuccess((e) => {
  try {
    const payment = e.record
    const projectId = payment.getString('projeto_id')
    if (!projectId) return e.next()

    const project = $app.findRecordById('projetos_cliente', projectId)
    const clientId = project.getString('cliente')

    if (clientId) {
      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('user', clientId)
      notif.set('title', 'Novo Pagamento Registrado')

      const val = payment.getFloat('valor')
      const formattedVal = 'R$ ' + val.toFixed(2).replace('.', ',')

      notif.set(
        'message',
        'Um novo pagamento no valor de ' + formattedVal + ' foi adicionado ao seu projeto.',
      )
      notif.set('read', false)
      notif.set('link', '/gestao/painel-cliente')

      $app.save(notif)
    }
  } catch (err) {
    console.log('Error in on_payment_created hook: ' + err)
  }
  return e.next()
}, 'pagamentos_projeto')
