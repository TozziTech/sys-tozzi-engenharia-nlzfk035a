onRecordAfterDeleteSuccess((e) => {
  try {
    const projectId = e.record.getString('project')
    if (!projectId) return e.next()

    const responsible = e.record.getString('responsible')
    const designer = e.record.getString('designer')

    const usersToCheck = new Set()
    if (responsible) usersToCheck.add(responsible)
    if (designer) usersToCheck.add(designer)

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
              `Seu acesso ao projeto ${project.getString('name')} foi removido porque a última etapa associada a você foi excluída.`,
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
    console.log('Error in project_module_access_cleanup_delete:', err)
  }
  return e.next()
}, 'project_modules')
