onRecordCreate((e) => {
  const status = e.record.get('status')
  const account = e.record.get('bank_account')

  if (e.record.get('is_recurring') && !e.record.get('recurrence_group_id')) {
    e.record.set('recurrence_group_id', $security.randomString(16))
  }

  if (!e.record.get('code')) {
    let maxNum = 0
    try {
      const result = new DynamicModel({ maxNum: 0 })
      $app
        .db()
        .newQuery(
          "SELECT IFNULL(MAX(CAST(SUBSTR(code, 5) AS INTEGER)), 0) as maxNum FROM financial_records WHERE code LIKE 'FIN-%'",
        )
        .one(result)
      maxNum = parseInt(result.maxNum, 10) || 0
    } catch (err) {
      console.log('Error finding max code', err)
    }
    const nextCode = 'FIN-' + String(maxNum + 1).padStart(3, '0')
    e.record.set('code', nextCode)
  }

  // Defensive check to ensure we only attempt to update the balance if a valid account ID exists
  if (
    status === 'Pago' &&
    account &&
    typeof account === 'string' &&
    account.trim() !== '' &&
    account !== 'none' &&
    account !== 'null'
  ) {
    const amount = e.record.get('amount') || 0
    const type = e.record.get('type')
    const impact = type === 'Entrada' ? amount : -amount

    try {
      $app
        .db()
        .newQuery('UPDATE bank_accounts SET balance = balance + {:impact} WHERE id = {:id}')
        .bind({ impact, id: account })
        .execute()
    } catch (err) {
      console.log('Error updating bank account balance:', err)
      throw new BadRequestError(
        'Erro ao atualizar saldo da conta bancária vinculada. Verifique os dados e tente novamente.',
      )
    }
  }

  e.next()
}, 'financial_records')
