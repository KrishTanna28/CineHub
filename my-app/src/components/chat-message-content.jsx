"use client"

const APP_URL_PREFIX = "https://cinnect.vercel.app"
const INTERNAL_ROUTE_PATTERN = /^\/(communities|reviews|movies|tv|profile|search)(?:\/|$|[?#])/

function isSafeInternalHref(href) {
  return (
    (href.startsWith("/") && !href.startsWith("//") && INTERNAL_ROUTE_PATTERN.test(href)) ||
    href.startsWith(`${APP_URL_PREFIX}/`)
  )
}

function normalizeHref(href) {
  if (!href.startsWith(`${APP_URL_PREFIX}/`)) return href

  try {
    const url = new URL(href)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
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
  if (!isSafeInternalHref(href)) return null

  return (
    <a
      key={key}
      href={normalizeHref(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
    >
      {label}
    </a>
  )
}

function renderLinks(content) {
  const text = String(content || "")
  const linkPattern = /(\[([^\]\n]+)\]\(((?:\/|https:\/\/cinnect\.vercel\.app\/)[^)\s]+)\))|((?:https:\/\/cinnect\.vercel\.app)?\/(?:communities|reviews|movies|tv|profile|search)(?:\/[^\s<>()\]]*)?(?:[?#][^\s<>()\]]*)?)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    const fullMatch = match[0]
    const markdownLabel = match[2]
    const markdownHref = match[3]
    const rawHref = match[4]

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (markdownHref) {
      parts.push(createLink(markdownLabel, markdownHref, `${markdownHref}-${match.index}`) || fullMatch)
    } else {
      const { href, trailing } = splitTrailingPunctuation(rawHref)
      parts.push(createLink(href, href, `${href}-${match.index}`) || rawHref)
      if (trailing) parts.push(trailing)
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
