// @deps pdf-lib@1.17.1
routerAdd(
  'POST',
  '/backend/v1/checklists/{id}/pdf',
  async (e) => {
    const { PDFDocument } = require('pdf-lib')

    const id = e.request.pathValue('id')
    const execution = $app.findRecordById('checklist_executions', id)

    $app.expandRecord(execution, ['template', 'responsible'])

    const template = execution.expandedOne('template')
    const responsible = execution.expandedOne('responsible')

    const doc = await PDFDocument.create()
    const page = doc.addPage([595.28, 841.89]) // A4 format

    page.drawText('Relatorio de Checklist', { x: 50, y: 800, size: 20 })
    page.drawText(`Data: ${execution.get('inspection_date')}`, { x: 50, y: 770, size: 12 })
    page.drawText(`Local: ${execution.get('location')}`, { x: 50, y: 750, size: 12 })
    page.drawText(`Responsavel: ${responsible ? responsible.get('name') : 'N/A'}`, {
      x: 50,
      y: 730,
      size: 12,
    })
    page.drawText(`Modelo: ${template ? template.get('name') : 'N/A'}`, { x: 50, y: 710, size: 12 })

    const score = execution.get('compliance_score') || 0
    page.drawText(`Conformidade: ${score}%`, { x: 50, y: 690, size: 12 })

    let y = 650
    const responses = execution.get('responses') || []
    page.drawText('Itens do Checklist:', { x: 50, y, size: 14 })
    y -= 20

    responses.forEach((resp) => {
      if (y < 50) {
        // Just truncating items for the scope of this simplified report
      } else {
        const statusText = resp.checked ? '[ SIM ]' : '[ NAO ]'
        const text = `${statusText} ${resp.itemName} - Obs: ${resp.notes || 'Nenhuma'}`.substring(
          0,
          80,
        )
        page.drawText(text, { x: 50, y, size: 10 })
        y -= 15
      }
    })

    const pdfBytes = await doc.save()

    const filename = `checklist_${execution.get('location').replace(/\s+/g, '_')}_${Date.now()}.pdf`
    const file = $filesystem.fileFromBytes(pdfBytes, filename)

    execution.set('report_file', file)
    $app.save(execution)

    const baseUrl = $os.getenv('VITE_POCKETBASE_URL') || ''
    const fileUrl = `${baseUrl}/api/files/checklist_executions/${execution.id}/${execution.get('report_file')}`

    return e.json(200, { publicUrl: fileUrl })
  },
  $apis.requireAuth(),
)
