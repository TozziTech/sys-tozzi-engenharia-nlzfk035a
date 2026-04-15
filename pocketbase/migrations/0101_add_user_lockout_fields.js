migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    if (!col.fields.getByName('failed_attempts')) {
      col.fields.add(new NumberField({ name: 'failed_attempts' }))
    }

    if (!col.fields.getByName('lockout_until')) {
      col.fields.add(new DateField({ name: 'lockout_until' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('failed_attempts')
    col.fields.removeByName('lockout_until')
    app.save(col)
  },
)
