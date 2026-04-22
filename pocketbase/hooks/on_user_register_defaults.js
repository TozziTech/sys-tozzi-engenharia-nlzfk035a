onRecordCreateRequest((e) => {
  const authRecord = e.auth
  let isAdmin = false

  if (authRecord && authRecord.collection().name === 'users') {
    isAdmin = authRecord.getString('role') === 'Administrador'
  }

  if (!isAdmin && !e.hasSuperuserAuth()) {
    // Public registration: force defaults to prevent privilege escalation
    e.record.set('status', 'Pendente')
    e.record.set('role', 'Projetista')
  } else {
    // Admin registration: use provided values, fallback if empty
    if (!e.record.getString('status')) e.record.set('status', 'Ativo')
    if (!e.record.getString('role')) e.record.set('role', 'Projetista')
  }

  e.next()
}, 'users')
