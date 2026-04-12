migrate(
  (app) => {
    let changed = true
    let maxLoops = 10 // safety net to prevent infinite loops in deep trees
    while (changed && maxLoops > 0) {
      changed = false
      maxLoops--
      const records = app.findRecordsByFilter('tasks', '1=1', '', 0, 0)
      for (let i = 0; i < records.length; i++) {
        const task = records[i]
        const taskId = task.get('id')
        const children = app.findRecordsByFilter('tasks', `parent_task = '${taskId}'`, '', 0, 0)
        if (children.length > 0) {
          let allConcluido = true
          let allPendente = true
          for (let j = 0; j < children.length; j++) {
            const child = children[j]
            const status = child.get('status')
            if (status !== 'Concluído') allConcluido = false
            if (status !== 'Pendente') allPendente = false
          }
          let newStatus = 'Pendente'
          if (allConcluido) {
            newStatus = 'Concluído'
          } else if (!allPendente) {
            newStatus = 'Em Andamento'
          }

          if (task.get('status') !== newStatus) {
            task.set('status', newStatus)
            app.save(task)
            changed = true
          }
        }
      }
    }
  },
  (app) => {
    // Cannot reliably revert calculated statuses back to arbitrary old states
  },
)
