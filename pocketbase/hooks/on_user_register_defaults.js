onRecordCreateRequest((e) => {
  const body = e.requestInfo().body

  let isAdmin = false
  if (e.auth && e.auth.getString('role') === 'Administrador') {
    isAdmin = true
  }

  // Enforce Pendente status for self-registered users
  if (!e.hasSuperuserAuth() && !isAdmin) {
    body.status = 'Pendente'
    body.role = 'Visitante'

    if (!body.codigo) {
      body.codigo = 'P-' + $security.randomString(6).toUpperCase()
    }
  }

  e.next()
}, 'users')
