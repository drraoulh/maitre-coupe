import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from './utils'

/** Charge des données asynchrones avec état de chargement, erreur et rechargement. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps)

  const reload = useCallback(async () => {
    try {
      setError('')
      setData(await load())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}
