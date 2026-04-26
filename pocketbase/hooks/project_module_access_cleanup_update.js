onRecordAfterUpdateSuccess((e) => {
  try {
    const original = e.record.original()
    const projectId = e.record.getString('project')
    if (!projectId) return e.next()

    const oldResponsible = original.getString('responsible')
    const newResponsible = e.record.getString('responsible')

    const oldDesigner = original.getString('designer')
    const newDesigner = e.record.getString('designer')

    const usersToCheck = new Set()

    if (oldResponsible && oldResponsible !== newResponsible) {
      usersToCheck.add(oldResponsible)
    }
    if (oldDesigner && oldDesigner !== newDesigner) {
      usersToCheck.add(oldDesigner)
    }

    if (usersToCheck.size === 0) return e.next()

    for (const userId of usersToCheck) {
      if (!userId) continue

      // Check user role
      try {
        const user = $app.findRecordById('users', userId)
        const role = user.getString('role')
        if (role === 'Administrador' || role === 'Gerente de Projeto') {
          continue
        }
      } catch (_) {
        continue // User not found
      }

      // Check if user is still assigned to any module in this project
      try {
        const remainingModules = $app.findRecordsByFilter(
          'project_modules',
          `project = "${projectId}" && (responsible = "${userId}" || designer = "${userId}")`,
          '',
          1,
          0,
        )

        if (remainingModules.length === 0) {
          // Revoke access
          try {
            const accessRecord = $app.findFirstRecordByFilter(
              'user_project_access',
              `user = "${userId}" && project = "${projectId}"`,
            )
            $app.delete(accessRecord)

            // Notify user
            const project = $app.findRecordById('projects', projectId)
            const notif = new Record($app.findCollectionByNameOrId('notifications'))
            notif.set('user', userId)
            notif.set('title', 'Acesso Revogado')
            notif.set(
              'message',
              `Seu acesso ao projeto ${project.getString('name')} foi removido porque você não possui mais tarefas atribuídas a ele.`,
            )
            notif.set('is_important', true)
            notif.set('read', false)
            notif.set('action_type', 'access_revoked')
            $app.saveNoValidate(notif)
          } catch (_) {
            // No access record found or delete failed
          }
        }
      } catch (err) {
        console.log('Error checking remaining modules:', err)
      }
    }
  } catch (err) {
    console.log('Error in project_module_access_cleanup_update:', err)
  }
  return e.next()
}, 'project_modules')
