routerAdd('POST', '/backend/v1/auth/login', (e) => {
  const body = e.requestInfo().body || {}
  const email = body.email
  const password = body.password

  if (!email || !password) {
    return e.badRequestError('Email e senha são obrigatórios.')
  }

  let user
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    return e.badRequestError('Credenciais inválidas.')
  }

  const lockoutStr = user.getString('lockout_until')
  if (lockoutStr) {
    const parseableStr = lockoutStr.includes('T') ? lockoutStr : lockoutStr.replace(' ', 'T')
    const lockoutTime = new Date(parseableStr).getTime()
    if (Date.now() < lockoutTime) {
      return e.badRequestError(
        'Muitas tentativas incorretas. Sua conta foi bloqueada temporariamente por 15 minutos.',
      )
    }
  }

  let url = $secrets.get('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
  if (url.endsWith('/')) url = url.slice(0, -1)

  const res = $http.send({
    url: url + '/api/collections/users/auth-with-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password: password }),
    timeout: 15,
  })

  if (res.statusCode === 200) {
    if (user.getInt('failed_attempts') > 0 || user.getString('lockout_until')) {
      user.set('failed_attempts', 0)
      user.set('lockout_until', '')
      $app.saveNoValidate(user)
    }
    return e.json(200, res.json)
  } else {
    let attempts = user.getInt('failed_attempts') + 1

    if (lockoutStr) {
      const parseableStr = lockoutStr.includes('T') ? lockoutStr : lockoutStr.replace(' ', 'T')
      if (Date.now() >= new Date(parseableStr).getTime()) {
        attempts = 1
      }
    }

    user.set('failed_attempts', attempts)

    if (attempts >= 5) {
      const lockTime = new Date(Date.now() + 15 * 60000)
      user.set('lockout_until', lockTime.toISOString().replace('T', ' '))

      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const auditLog = new Record(auditCol)
        auditLog.set('user_id', user.id)
        auditLog.set('action', 'ACCOUNT_LOCKOUT')
        auditLog.set('resource', 'users')
        auditLog.set('details', { reason: '5 failed login attempts', attempts: attempts })
        $app.saveNoValidate(auditLog)
      } catch (err) {
        console.log('Failed to create audit log: ' + err)
      }

      $app.saveNoValidate(user)
      return e.badRequestError(
        'Muitas tentativas incorretas. Sua conta foi bloqueada temporariamente por 15 minutos.',
      )
    }

    $app.saveNoValidate(user)
    return e.badRequestError('Credenciais inválidas.')
  }
})
