onRecordAfterCreateSuccess((e) => {
  const record = e.record

  if (record.get('is_critical') === true) {
    try {
      const moduleId = record.get('module')
      const module = $app.findRecordById('project_modules', moduleId)

      const projectId = module.get('project')
      const project = $app.findRecordById('projects', projectId)

      const projectName = project.get('name')
      const moduleName = module.get('name')
      const versionLabel = record.get('version_label')

      const dashboardUrl = $secrets.get('PB_INSTANCE_URL') || 'https://dashboard.exemplo.com'
      const link = `${dashboardUrl}/projects/${projectId}/disciplines/${moduleId}`

      const emailBody = `
        Nova Versão Crítica Adicionada
        
        Projeto: ${projectName}
        Disciplina: ${moduleName}
        Versão: ${versionLabel}
        
        Acesse o painel para revisar: ${link}
      `

      console.log(
        `[CRITICAL NOTIFICATION] Preparing to send email for Project: ${projectName}, Module: ${moduleName}, Version: ${versionLabel}`,
      )

      $http.send({
        url: 'https://httpbin.org/post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[Urgente] Nova Versão Crítica: ${projectName} - ${moduleName}`,
          text: emailBody,
          to: 'equipe@tozziengenharia.com',
        }),
        timeout: 15,
      })

      console.log('[CRITICAL NOTIFICATION] Webhook triggered successfully.')
    } catch (err) {
      console.log('Error processing critical version notification: ', err)
    }
  }

  e.next()
}, 'project_versions')
