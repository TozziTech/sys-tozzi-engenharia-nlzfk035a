onRecordUpdateRequest((e) => {
  const authRecord = e.auth
  if (!authRecord) {
    throw new UnauthorizedError('Authentication required.')
  }

  const body = e.requestInfo().body

  if (body.role !== undefined) {
    if (authRecord.get('role') !== 'Administrador') {
      const currentRole = e.record.get('role')
      if (body.role !== currentRole) {
        throw new ForbiddenError('Apenas Administradores podem modificar níveis de acesso.')
      }
    }
  }

  e.next()
}, 'users')
