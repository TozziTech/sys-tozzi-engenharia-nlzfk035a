onRecordAfterCreateSuccess((e) => {
  try {
    const audit = new Record($app.findCollectionByNameOrId('audit_logs'))
    audit.set('user_id', e.auth?.id || '')
    audit.set('action', 'create_custom_role')
    audit.set('resource', 'custom_roles')
    audit.set('details', { role_name: e.record.getString('name'), id: e.record.id })
    $app.saveNoValidate(audit)
  } catch (err) {
    $app.logger().error('audit log failed', 'error', err)
  }
  e.next()
}, 'custom_roles')
