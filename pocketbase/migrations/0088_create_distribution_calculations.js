migrate(
  (app) => {
    const collection = new Collection({
      name: 'distribution_calculations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'total_amount', type: 'number', required: true },
        { name: 'working_capital_pct', type: 'number' },
        { name: 'expenses', type: 'number' },
        { name: 'samuel_pct', type: 'number' },
        { name: 'tozzi_pct', type: 'number' },
        { name: 'net_value', type: 'number' },
        { name: 'samuel_amount', type: 'number' },
        { name: 'tozzi_amount', type: 'number' },
        { name: 'date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_dist_calc_date ON distribution_calculations (date DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('distribution_calculations')
    app.delete(collection)
  },
)
