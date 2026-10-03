import { useCallback, useState } from 'react'
import { getCases } from '../api/store'

export function useCases() {
  const [cases, setCases] = useState(getCases)
  const refresh = useCallback(() => setCases(getCases()), [])
  return { cases, refresh }
}
