import { useState } from 'react'

interface PoseImageProps {
  imageUrl: string | null
  altText: string
  linkUrl?: string | null
}

function Silhouette() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="28" cy="9" r="5" fill="#d1d5db" />
      <line x1="28" y1="14" x2="28" y2="32" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="22" x2="44" y2="22" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="32" x2="18" y2="47" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="32" x2="38" y2="47" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function PoseImage({ imageUrl, altText, linkUrl }: PoseImageProps) {
  const [errored, setErrored] = useState(false)

  const showPlaceholder = !imageUrl || errored
  const isClickable = !!linkUrl

  const inner = showPlaceholder ? (
    <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
      <Silhouette />
    </div>
  ) : (
    <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={altText}
        className="w-full h-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  )

  if (isClickable) {
    return (
      <a
        href={linkUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${isClickable ? 'cursor-pointer' : ''}`}
        aria-label={`Open reference for ${altText}`}
      >
        {inner}
      </a>
    )
  }

  return <>{inner}</>
}
