import { format } from 'date-fns'
import { Log } from './mock-logs'

export function exportExcel(logs: Log[], totalProjects: number) {
  const escapeXml = (unsafe: string) =>
    unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;'
        case '>':
          return '&gt;'
        case '&':
          return '&amp;'
        case "'":
          return '&apos;'
        case '"':
          return '&quot;'
        default:
          return c
      }
    })

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="BoldHeader">
      <Font ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Audit Log">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="120"/>
      <Column ss:AutoFitWidth="1" ss:Width="120"/>
      <Column ss:AutoFitWidth="1" ss:Width="80"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Row>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Date</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Author</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Action</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Entity</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Old Value</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">New Value</Data></Cell>
      </Row>
      ${logs
        .map((log) => {
          if (log.changes.length === 0) {
            return `
            <Row>
              <Cell><Data ss:Type="String">${escapeXml(format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'))}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.user.name)}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.action)}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.entityName)}</Data></Cell>
              <Cell><Data ss:Type="String"></Data></Cell>
              <Cell><Data ss:Type="String"></Data></Cell>
            </Row>
          `
          }
          return log.changes
            .map(
              (change) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'))}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.user.name)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.action)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.entityName)} - ${escapeXml(change.field)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(change.oldValue || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(change.newValue || '')}</Data></Cell>
          </Row>
        `,
            )
            .join('')
        })
        .join('')}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Summary">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="100"/>
      <Row>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Metric</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Value</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Projects</Data></Cell>
        <Cell><Data ss:Type="Number">${totalProjects}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Logs</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Updates</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Update').length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Creations</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Create').length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Deletions</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Delete').length}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `System_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
