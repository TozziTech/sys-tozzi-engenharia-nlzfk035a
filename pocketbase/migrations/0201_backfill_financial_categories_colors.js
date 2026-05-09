migrate(
  (app) => {
    const categories = app.findRecordsByFilter('financial_categories', '1=1', '-created', 10000, 0)

    const defaultColors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#14b8a6',
      '#f43f5e',
      '#6366f1',
      '#84cc16',
      '#34d399',
      '#f97316',
      '#eab308',
      '#a855f7',
    ]

    for (const cat of categories) {
      const currentColor = cat.getString('color')
      if (!currentColor) {
        let hash = 0
        const name = cat.getString('name') || ''
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        const colorIndex = Math.abs(hash) % defaultColors.length

        cat.set('color', defaultColors[colorIndex])
        app.save(cat)
      }
    }
  },
  (app) => {
    // Empty down migration as we cannot reliably revert back to null
  },
)
