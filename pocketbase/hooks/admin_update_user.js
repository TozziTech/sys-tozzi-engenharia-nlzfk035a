routerAdd(
  'POST',
  '/backend/v1/admin/update-user',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('role') !== 'Administrador') {
      throw new ForbiddenError('Apenas administradores podem realizar esta ação.')
    }

    const body = e.requestInfo().body
    if (!body || !body.id) {
      throw new BadRequestError('ID do usuário é obrigatório.')
    }

    const record = $app.findRecordById('users', body.id)

    if (body.status !== undefined) record.set('status', body.status)
    if (body.role !== undefined) record.set('role', body.role)
    if (body.codigo !== undefined) record.set('codigo', body.codigo)
    if (body.must_change_password !== undefined)
      record.set('must_change_password', body.must_change_password)

    if (body.password) {
      record.setPassword(body.password)
    }

    $app.save(record)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
