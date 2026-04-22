onRecordUpdateRequest((e) => {
  const authRecord = e.auth
  let isAdmin = false

  if (authRecord && authRecord.collection().name === 'users') {
    isAdmin = authRecord.getString('role') === 'Administrador'
  }

  if (!isAdmin && !e.hasSuperuserAuth()) {
    // Prevent non-admins from updating their role or status
    const originalRole = e.record.original().getString('role')
    const originalStatus = e.record.original().getString('status')

    if (e.record.getString('role') !== originalRole) {
      e.record.set('role', originalRole)
    }

    if (e.record.getString('status') !== originalStatus) {
      e.record.set('status', originalStatus)
    }
  }

  e.next()
}, 'users')
