"use client"

const APP_URL_PREFIX = (process.env.NEXT_PUBLIC_FRONTEND_URL || "https://cinnect.vercel.app").replace(/\/$/, "")
const INTERNAL_APP_HOST_PATTERN = String.raw`https:\/\/(?:www\.)?cinnect\.(?:vercel\.app|com)`
const INTERNAL_ROUTE_PATTERN = /^\/(communities|reviews|movies|tv|profile|search)(?:\/|$|[?#])/

function toCanonicalAppUrl(href) {
  if (!href) return href

  if (href.startsWith(`${APP_URL_PREFIX}/`)) return href

  if (href.startsWith("/")) {
    return `${APP_URL_PREFIX}${href}`
  }

  try {
    const url = new URL(href)

    if (url.hostname === "cinnect.vercel.app") {
      return `${APP_URL_PREFIX}${url.pathname}${url.search}${url.hash}`
    }

    return href
  } catch {
    return href
  }
}

function isSafeInternalHref(href) {
  if (!href) return false

  return (
    (href.startsWith("/") && !href.startsWith("//") && INTERNAL_ROUTE_PATTERN.test(href)) ||
    href.startsWith(`${APP_URL_PREFIX}/`) ||
    href.startsWith("https://cinnect.com/") ||
    href.startsWith("https://www.cinnect.com/") ||
    href.startsWith("https://cinnect.vercel.app/") ||
    href.startsWith("https://www.cinnect.vercel.app/")
  )
}

function normalizeHref(href) {
  return toCanonicalAppUrl(href)
}

function splitTrailingPunctuation(href) {
  const match = href.match(/^(.+)([.,!?;:])$/)
  if (!match) return { href, trailing: "" }

  return {
    href: match[1],
    trailing: match[2]
  }
}

function createLink(label, href, key) {
  const canonicalHref = normalizeHref(href)

  if (!isSafeInternalHref(href) && !isSafeInternalHref(canonicalHref)) return null

  return (
    <a
      key={key}
      href={canonicalHref}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
    >
      {canonicalHref}
    </a>
  )
}

function renderLinks(content) {
  const text = String(content || "")
  const linkPattern = new RegExp(
    `(\\[([^\\]\\n]+)\\]\\(((?:\\/|${INTERNAL_APP_HOST_PATTERN}\\/)[^)\\s]+)\\))|((?:${INTERNAL_APP_HOST_PATTERN})?\\/(?:communities|reviews|movies|tv|profile|search)(?:\\/[^\\s<>()\\]]*)?(?:[?#][^\\s<>()\\]]*)?)`,
    "g"
  )
  const parts = []
  let lastIndex = 0
  const seenInternalLinks = new Set()
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    const fullMatch = match[0]
    const markdownHref = match[3]
    const rawHref = match[4]

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (markdownHref) {
      const canonicalHref = normalizeHref(markdownHref)

      if (!seenInternalLinks.has(canonicalHref)) {
        const link = createLink(markdownHref, markdownHref, `${markdownHref}-${match.index}`)
        if (link) {
          parts.push(link)
          seenInternalLinks.add(canonicalHref)
        } else {
          parts.push(fullMatch)
        }
      }
    } else {
      const { href, trailing } = splitTrailingPunctuation(rawHref)
      const canonicalHref = normalizeHref(href)

      if (!seenInternalLinks.has(canonicalHref)) {
        const link = createLink(href, href, `${href}-${match.index}`)
        if (link) {
          parts.push(link)
          seenInternalLinks.add(canonicalHref)
          if (trailing) parts.push(trailing)
        } else {
          parts.push(rawHref)
          if (trailing) parts.push(trailing)
        }
      } else if (trailing) {
        parts.push(trailing)
      }
    }

    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export default function ChatMessageContent({ content }) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {renderLinks(content)}
    </p>
  )
}
