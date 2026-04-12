onRecordAfterCreateSuccess((e) => {
  const syncParentTask = (parentId) => {
    if (!parentId) return
    const children = $app.findRecordsByFilter('tasks', `parent_task = '${parentId}'`, '', 0, 0)
    if (children.length === 0) return
    let allConcluido = true
    let allPendente = true
    for (let i = 0; i < children.length; i++) {
      const status = children[i].get('status')
      if (status !== 'Concluído') allConcluido = false
      if (status !== 'Pendente') allPendente = false
    }
    let newStatus = 'Pendente'
    if (allConcluido) {
      newStatus = 'Concluído'
    } else if (!allPendente) {
      newStatus = 'Em Andamento'
    }
    const parent = $app.findRecordById('tasks', parentId)
    if (parent.get('status') !== newStatus) {
      parent.set('status', newStatus)
      $app.saveNoValidate(parent)
      const grandParentId = parent.get('parent_task')
      if (grandParentId) {
        syncParentTask(grandParentId)
      }
    }
  }
  syncParentTask(e.record.get('parent_task'))
  e.next()
}, 'tasks')

onRecordAfterUpdateSuccess((e) => {
  const syncParentTask = (parentId) => {
    if (!parentId) return
    const children = $app.findRecordsByFilter('tasks', `parent_task = '${parentId}'`, '', 0, 0)
    if (children.length === 0) return
    let allConcluido = true
    let allPendente = true
    for (let i = 0; i < children.length; i++) {
      const status = children[i].get('status')
      if (status !== 'Concluído') allConcluido = false
      if (status !== 'Pendente') allPendente = false
    }
    let newStatus = 'Pendente'
    if (allConcluido) {
      newStatus = 'Concluído'
    } else if (!allPendente) {
      newStatus = 'Em Andamento'
    }
    const parent = $app.findRecordById('tasks', parentId)
    if (parent.get('status') !== newStatus) {
      parent.set('status', newStatus)
      $app.saveNoValidate(parent)
      const grandParentId = parent.get('parent_task')
      if (grandParentId) {
        syncParentTask(grandParentId)
      }
    }
  }
  syncParentTask(e.record.get('parent_task'))
  e.next()
}, 'tasks')

onRecordAfterDeleteSuccess((e) => {
  const syncParentTask = (parentId) => {
    if (!parentId) return
    const children = $app.findRecordsByFilter('tasks', `parent_task = '${parentId}'`, '', 0, 0)
    if (children.length === 0) return
    let allConcluido = true
    let allPendente = true
    for (let i = 0; i < children.length; i++) {
      const status = children[i].get('status')
      if (status !== 'Concluído') allConcluido = false
      if (status !== 'Pendente') allPendente = false
    }
    let newStatus = 'Pendente'
    if (allConcluido) {
      newStatus = 'Concluído'
    } else if (!allPendente) {
      newStatus = 'Em Andamento'
    }
    const parent = $app.findRecordById('tasks', parentId)
    if (parent.get('status') !== newStatus) {
      parent.set('status', newStatus)
      $app.saveNoValidate(parent)
      const grandParentId = parent.get('parent_task')
      if (grandParentId) {
        syncParentTask(grandParentId)
      }
    }
  }
  syncParentTask(e.record.get('parent_task'))
  e.next()
}, 'tasks')
