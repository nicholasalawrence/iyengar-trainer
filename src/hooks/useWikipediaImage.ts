import { useState, useEffect } from 'react'
import type { Pose } from '../types'

// Module-level cache so images aren't re-fetched across re-renders or pose navigation
const cache = new Map<string, string | null>()

/**
 * Fetches the Wikipedia thumbnail for a yoga pose.
 * Tries the romanised name first, then English name.
 * Returns null while loading or if no image is found.
 */
export function useWikipediaImage(pose: Pose | null): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (!pose) return null
    return cache.get(pose.id) ?? null
  })

  useEffect(() => {
    if (!pose) {
      setImageUrl(null)
      return
    }

    // Already cached
    if (cache.has(pose.id)) {
      setImageUrl(cache.get(pose.id) ?? null)
      return
    }

    const controller = new AbortController()

    function stripDiacritics(s: string): string {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

    async function fetchImage() {
      const romanised = pose!.nameRomanised
      const ascii = stripDiacritics(romanised)
      const english = pose!.nameEnglish

      // Try: original name, diacritics-stripped, English name (deduplicated)
      const namesToTry = [...new Set(
        [romanised, ascii, english].filter((n): n is string => !!n)
      )]

      for (const name of namesToTry) {
        try {
          const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { signal: controller.signal }
          )
          if (!res.ok) continue
          const data = await res.json() as { thumbnail?: { source: string } }
          if (data.thumbnail?.source) {
            cache.set(pose!.id, data.thumbnail.source)
            setImageUrl(data.thumbnail.source)
            return
          }
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
          // continue to next name
        }
      }

      // Nothing found
      cache.set(pose!.id, null)
      setImageUrl(null)
    }

    fetchImage()

    return () => controller.abort()
  }, [pose?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return imageUrl
}
