onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')
  const role = e.record.getString('role')

  if (oldStatus === 'Pendente' && newStatus === 'Ativo') {
    try {
      if (role === 'Cliente') {
        const clientsCol = $app.findCollectionByNameOrId('clients')
        let clientExists = false
        try {
          if (e.record.getString('email')) {
            $app.findFirstRecordByData('clients', 'email', e.record.getString('email'))
            clientExists = true
          }
        } catch (_) {}

        if (!clientExists) {
          const newClient = new Record(clientsCol)
          newClient.set('name', e.record.getString('name') || 'Novo Cliente')
          newClient.set('email', e.record.getString('email'))
          newClient.set('phone', e.record.getString('phone'))
          newClient.set(
            'code',
            'CLI-' + $security.randomStringWithAlphabet(6, '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
          )
          newClient.set('status', 'Ativo')
          $app.save(newClient)
        }
      } else if (role === 'Projetista') {
        let changed = false
        const rec = $app.findRecordById('users', e.record.id)
        if (!rec.getString('crea')) {
          rec.set('crea', 'Pendente')
          changed = true
        }
        if (!rec.getString('formacao')) {
          rec.set('formacao', 'Não informada')
          changed = true
        }
        if (changed) {
          $app.saveNoValidate(rec)
        }
      }
    } catch (err) {
      $app.logger().error('Error running user approval automation', 'error', String(err))
    }
  }

  e.next()
}, 'users')
