import { useStorage } from '../storage/StorageContext'

interface SourceResolverContext {
  canonicalSourceId: string
  userEnabledSources: string[]
}

interface SourceResolverResult {
  referenceLabel: string
  referenceUrl: string | null
  imageUrl: string | null
}

export function useSourceResolver(
  poseId: string,
  context: SourceResolverContext
): SourceResolverResult {
  const storage = useStorage()
  const poses = storage.getPoses()
  const sources = storage.getSources()

  const pose = poses.find(p => p.id === poseId)

  if (!pose) {
    return {
      referenceLabel: '',
      referenceUrl: null,
      imageUrl: null,
    }
  }

  // Image URL: find first enabled website source with imageUrlPattern
  let imageUrl: string | null = null
  for (const sourceId of context.userEnabledSources) {
    const source = sources.find(s => s.id === sourceId)
    if (source && source.type === 'website' && source.imageUrlPattern) {
      imageUrl = source.imageUrlPattern.replace('{id}', pose.id)
      break
    }
  }

  // Reference label: from canonical source (may be a book with no URL)
  let referenceLabel = ''
  let referenceUrl: string | null = null

  const canonicalSource = sources.find(s => s.id === context.canonicalSourceId)

  if (canonicalSource) {
    if (canonicalSource.type === 'book') {
      const poseRef = pose.references?.find(r => r.sourceId === context.canonicalSourceId)
      const page = poseRef?.page
      referenceLabel = page
        ? `p. ${page} in ${canonicalSource.name}`
        : canonicalSource.name
      // No URL from a book — fall through to find one below
    } else if (canonicalSource.type === 'website' && canonicalSource.urlPattern) {
      referenceLabel = canonicalSource.name
      referenceUrl = canonicalSource.urlPattern.replace('{id}', pose.id)
    } else if (canonicalSource.type === 'video') {
      referenceLabel = `Search on ${canonicalSource.name}`
      const query = encodeURIComponent(`${pose.nameRomanised} yoga`)
      referenceUrl = `https://www.youtube.com/results?search_query=${query}`
    }
  }

  // If still no URL (e.g. canonical source is a book), find a fallback URL
  // from the user's enabled sources in priority order
  if (!referenceUrl) {
    for (const sourceId of context.userEnabledSources) {
      const source = sources.find(s => s.id === sourceId)
      if (!source || source.id === context.canonicalSourceId) continue
      if (source.type === 'website' && source.urlPattern) {
        referenceUrl = source.urlPattern.replace('{id}', pose.id)
        break
      } else if (source.type === 'video') {
        const query = encodeURIComponent(`${pose.nameRomanised} yoga`)
        referenceUrl = `https://www.youtube.com/results?search_query=${query}`
        break
      }
    }
  }

  // Last resort: YouTube search
  if (!referenceUrl) {
    const query = encodeURIComponent(`${pose.nameRomanised} yoga`)
    referenceUrl = `https://www.youtube.com/results?search_query=${query}`
  }

  return { referenceLabel, referenceUrl, imageUrl }
}
