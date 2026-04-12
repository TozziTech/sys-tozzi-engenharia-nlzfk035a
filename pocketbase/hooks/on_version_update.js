onRecordUpdateRequest((e) => {
  const oldRecord = $app.findRecordById('project_versions', e.record.id)

  const changes = {}
  const fields = ['status', 'version_label', 'revision', 'description', 'is_critical']
  let hasChanges = false

  fields.forEach((f) => {
    const oldVal = oldRecord.get(f)
    const newVal = e.record.get(f)
    if (oldVal != newVal) {
      changes[f] = { old: oldVal, new: newVal }
      hasChanges = true
    }
  })

  if (hasChanges) {
    e.set('version_changes', changes)
  }

  e.next()
}, 'project_versions')

onRecordAfterUpdateSuccess((e) => {
  const changes = e.get('version_changes')
  if (changes) {
    let userId = null
    if (e.auth) {
      userId = e.auth.id
    }

    if (userId) {
      const collection = $app.findCollectionByNameOrId('audit_logs')
      const record = new Record(collection)
      record.set('user_id', userId)
      record.set('action', 'Update')
      record.set('resource', 'project_versions')
      record.set('details', {
        version_id: e.record.id,
        module_id: e.record.get('module'),
        version_label: e.record.get('version_label'),
        changes: changes,
      })
      $app.save(record)
    }
  }
  e.next()
}, 'project_versions')
