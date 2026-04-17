export const maskCEP = (val: string) =>
  val
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)

export const handleMaskedChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  maskFn: (v: string) => string,
  onChange: (v: string) => void,
) => {
  const input = e.target
  const oldVal = input.value
  const oldCursor = input.selectionStart || 0
  const unmaskedBeforeCursor = oldVal.slice(0, oldCursor).replace(/\D/g, '')
  const newVal = maskFn(oldVal)
  onChange(newVal)

  if (document.activeElement === input) {
    window.requestAnimationFrame(() => {
      if (input && document.activeElement === input) {
        let newCursor = 0,
          digitsFound = 0
        for (let i = 0; i < newVal.length; i++) {
          if (/\d/.test(newVal[i])) digitsFound++
          if (digitsFound === unmaskedBeforeCursor.length) {
            newCursor = i + 1
            while (newCursor < newVal.length && !/\d/.test(newVal[newCursor])) newCursor++
            break
          }
        }
        if (unmaskedBeforeCursor.length === 0) newCursor = 0
        input.setSelectionRange(newCursor, newCursor)
      }
    })
  }
}
