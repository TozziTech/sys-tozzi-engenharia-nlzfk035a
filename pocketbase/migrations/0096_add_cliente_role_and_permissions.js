migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    const roleField = usersCol.fields.getByName('role')

    if (roleField) {
      const values = roleField.values || []
      if (!values.includes('Cliente')) {
        values.push('Cliente')
        roleField.values = values
        app.save(usersCol)
      }
    }

    const restrictFromClient = (colName) => {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (col) {
          const rule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
          col.listRule = rule
          col.viewRule = rule
          col.createRule = rule
          col.updateRule = rule
          col.deleteRule = rule
          app.save(col)
        }
      } catch (_) {}
    }

    restrictFromClient('projects')
    restrictFromClient('tasks')
    restrictFromClient('financial_records')
  },
  (app) => {
    const revertRule = (colName) => {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (col) {
          const rule = "@request.auth.id != ''"
          col.listRule = rule
          col.viewRule = rule
          col.createRule = rule
          col.updateRule = rule
          col.deleteRule = rule
          app.save(col)
        }
      } catch (_) {}
    }

    revertRule('projects')
    revertRule('tasks')
    revertRule('financial_records')

    const usersCol = app.findCollectionByNameOrId('users')
    const roleField = usersCol.fields.getByName('role')

    if (roleField) {
      const values = roleField.values || []
      const index = values.indexOf('Cliente')
      if (index > -1) {
        values.splice(index, 1)
        roleField.values = values
        app.save(usersCol)
      }
    }
  },
)
