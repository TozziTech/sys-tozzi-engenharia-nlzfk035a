// @deps pdf-lib@1.17.1
routerAdd(
  'POST',
  '/backend/v1/gerar_relatorio_apa',
  async (e) => {
    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')

    const body = e.requestInfo().body || {}
    const { data_inicio, data_fim, disciplina } = body

    if (!data_inicio || !data_fim) {
      return e.badRequestError('data_inicio and data_fim are required')
    }

    const startStr = data_inicio.replace('T', ' ').substring(0, 19) + 'Z'
    const endStr = data_fim.replace('T', ' ').substring(0, 19) + 'Z'
    const filterStr = `created >= '${startStr}' && created <= '${endStr}'`

    let reports
    try {
      reports = $app.findRecordsByFilter('apa_reports', filterStr, '-created', 1000, 0)
    } catch (err) {
      reports = []
    }

    if (!reports || reports.length === 0) {
      return e.badRequestError('Nenhum dado encontrado para o periodo selecionado.')
    }

    $apis.enrichRecords(e, reports, 'project')

    let filteredReports = reports
    if (disciplina && disciplina !== 'all') {
      filteredReports = reports.filter((r) => {
        const p = r.expandedOne('project')
        return p && p.getString('discipline') === disciplina
      })
    }

    if (filteredReports.length === 0) {
      return e.badRequestError('Nenhum dado encontrado para o filtro selecionado.')
    }

    const reportIds = filteredReports.map((r) => r.id)
    const actionsFilter = reportIds.map((id) => `apa_report='${id}'`).join(' || ')

    let actions = []
    if (actionsFilter) {
      try {
        actions = $app.findRecordsByFilter('apa_actions', actionsFilter, '-created', 2000, 0)
      } catch (err) {
        actions = []
      }
    }

    const problemsCount = {}
    filteredReports.forEach((r) => {
      const text = r.getString('negative_points') || ''
      const points = text
        .split(/[\n,;]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 4)
      points.forEach((p) => {
        const key = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        problemsCount[key] = (problemsCount[key] || 0) + 1
      })
    })

    const topProblems = Object.entries(problemsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    let totalActions = actions.length
    let completedActions = actions.filter(
      (a) => a.getString('status') === 'concluida' || a.getString('status') === 'concluída',
    )
    let onTime = 0
    let late = 0

    completedActions.forEach((a) => {
      const updated = a.getDateTime('updated')
      const dueStr = a.getString('due_date')
      if (dueStr) {
        const due = new Date(dueStr)
        due.setHours(23, 59, 59, 999)
        if (updated.time() <= due.getTime()) {
          onTime++
        } else {
          late++
        }
      } else {
        onTime++
      }
    })

    const effectivenessRate = totalActions > 0 ? (completedActions.length / totalActions) * 100 : 0
    const onTimeRate = completedActions.length > 0 ? (onTime / completedActions.length) * 100 : 0

    const discStats = {}
    filteredReports.forEach((r) => {
      const p = r.expandedOne('project')
      const disc = p ? p.getString('discipline') || 'Outros' : 'Outros'
      if (!discStats[disc]) {
        discStats[disc] = {
          apas: 0,
          problems: 0,
          projects: new Set(),
          actionsTotal: 0,
          actionsOnTime: 0,
        }
      }
      discStats[disc].apas++
      if (p) discStats[disc].projects.add(p.id)

      const text = r.getString('negative_points') || ''
      const points = text
        .split(/[\n,;]+/)
        .map((pt) => pt.trim())
        .filter((pt) => pt.length > 4)
      discStats[disc].problems += points.length
    })

    actions.forEach((a) => {
      const rep = filteredReports.find((r) => r.id === a.getString('apa_report'))
      if (!rep) return
      const p = rep.expandedOne('project')
      const disc = p ? p.getString('discipline') || 'Outros' : 'Outros'
      if (discStats[disc]) {
        discStats[disc].actionsTotal++
        if (a.getString('status') === 'concluida' || a.getString('status') === 'concluída') {
          const updated = a.getDateTime('updated')
          const dueStr = a.getString('due_date')
          if (dueStr) {
            const due = new Date(dueStr)
            due.setHours(23, 59, 59, 999)
            if (updated.time() <= due.getTime()) discStats[disc].actionsOnTime++
          } else {
            discStats[disc].actionsOnTime++
          }
        }
      }
    })

    const tableData = Object.entries(discStats)
      .map(([disc, stats]) => {
        const avg = stats.projects.size > 0 ? (stats.problems / stats.projects.size).toFixed(1) : 0
        const eff =
          stats.actionsTotal > 0 ? ((stats.actionsOnTime / stats.actionsTotal) * 100).toFixed(1) : 0
        return { discipline: disc, apas: stats.apas, avg, eff }
      })
      .sort((a, b) => b.apas - a.apas)

    function cleanText(str) {
      if (!str) return ''
      let s = String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return s.replace(/[^\x20-\x7E]/g, '')
    }

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595.28, 841.89])
    const { width, height } = page.getSize()
    let cursorY = height - 50

    const drawText = (text, size, isBold = false, x = 50) => {
      if (cursorY < 50) {
        page = pdfDoc.addPage([595.28, 841.89])
        cursorY = height - 50
      }
      const sanitizedText = cleanText(text.replace(/[\r\n]+/g, ' '))
      page.drawText(sanitizedText, {
        x,
        y: cursorY,
        size,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      })
      cursorY -= size + 5
    }

    drawText('Relatorio de Licoes Aprendidas (APA)', 20, true)
    cursorY -= 10

    const dStart = new Date(data_inicio).toLocaleDateString('pt-BR')
    const dEnd = new Date(data_fim).toLocaleDateString('pt-BR')

    drawText(`Periodo: ${dStart} a ${dEnd}`, 12)
    drawText(
      `Filtro de Disciplina: ${disciplina && disciplina !== 'all' ? disciplina : 'Todas'}`,
      12,
    )
    cursorY -= 20

    drawText('Top 10 Problemas Recorrentes:', 16, true)
    cursorY -= 10
    if (topProblems.length === 0) {
      drawText('Nenhum problema registrado no periodo.', 12)
    } else {
      topProblems.forEach(([prob, count], i) => {
        const shortProb = prob.length > 70 ? prob.substring(0, 70) + '...' : prob
        drawText(`${i + 1}. ${shortProb} (${count} ocorrencias)`, 12)
      })
    }
    cursorY -= 20

    drawText('Efetividade de Acoes:', 16, true)
    cursorY -= 10
    drawText(`Total de Acoes: ${totalActions}`, 12)
    drawText(`Acoes Concluidas: ${completedActions.length} (${effectivenessRate.toFixed(1)}%)`, 12)
    drawText(`  - No Prazo: ${onTime} (${onTimeRate.toFixed(1)}% das concluidas)`, 12)
    drawText(`  - Atrasadas: ${late}`, 12)
    cursorY -= 20

    drawText('Comparativo por Disciplina:', 16, true)
    cursorY -= 10

    if (cursorY < 80) {
      page = pdfDoc.addPage([595.28, 841.89])
      cursorY = height - 50
    }
    page.drawText(cleanText('Disciplina'), { x: 50, y: cursorY, size: 12, font: boldFont })
    page.drawText(cleanText('APAs'), { x: 250, y: cursorY, size: 12, font: boldFont })
    page.drawText(cleanText('Prob/Proj'), { x: 320, y: cursorY, size: 12, font: boldFont })
    page.drawText(cleanText('Efetividade'), { x: 420, y: cursorY, size: 12, font: boldFont })
    cursorY -= 15

    tableData.forEach((row) => {
      if (cursorY < 50) {
        page = pdfDoc.addPage([595.28, 841.89])
        cursorY = height - 50
        page.drawText(cleanText('Disciplina'), { x: 50, y: cursorY, size: 12, font: boldFont })
        page.drawText(cleanText('APAs'), { x: 250, y: cursorY, size: 12, font: boldFont })
        page.drawText(cleanText('Prob/Proj'), { x: 320, y: cursorY, size: 12, font: boldFont })
        page.drawText(cleanText('Efetividade'), { x: 420, y: cursorY, size: 12, font: boldFont })
        cursorY -= 15
      }
      const dName =
        row.discipline.length > 25 ? row.discipline.substring(0, 25) + '...' : row.discipline
      page.drawText(cleanText(dName), { x: 50, y: cursorY, size: 10, font })
      page.drawText(cleanText(row.apas.toString()), { x: 250, y: cursorY, size: 10, font })
      page.drawText(cleanText(row.avg.toString()), { x: 320, y: cursorY, size: 10, font })
      page.drawText(cleanText(`${row.eff}%`), { x: 420, y: cursorY, size: 10, font })
      cursorY -= 15
    })

    const pages = pdfDoc.getPages()
    const d = new Date()
    const timestamp = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

    pages.forEach((p, i) => {
      p.drawText(`Gerado em: ${timestamp} | Pagina ${i + 1} de ${pages.length}`, {
        x: 50,
        y: 20,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      })
    })

    const pdfBytes = await pdfDoc.save()

    const generatedReportsCol = $app.findCollectionByNameOrId('generated_reports')
    const reportRecord = new Record(generatedReportsCol)
    reportRecord.set('title', `Relatorio_APA_${d.getTime()}`)

    const file = $filesystem.fileFromBytes(pdfBytes, `apa_report_${d.getTime()}.pdf`)
    reportRecord.set('file', file)

    $app.save(reportRecord)

    const fileUrl = `/api/files/${reportRecord.collectionId}/${reportRecord.id}/${reportRecord.getString('file')}`

    return e.json(200, { downloadUrl: fileUrl, recordId: reportRecord.id })
  },
  $apis.requireAuth(),
)
