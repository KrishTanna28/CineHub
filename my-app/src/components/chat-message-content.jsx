"use client"

function isSafeInternalHref(href) {
  return (
    (href.startsWith("/") && !href.startsWith("//")) ||
    href.startsWith("https://cinnect.vercel.app/")
  )
}

function renderMarkdownLinks(content) {
  const text = String(content || "")
  const linkPattern = /\[([^\]\n]+)\]\(((?:\/|https:\/\/cinnect\.vercel\.app\/)[^)\s]+)\)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    const [fullMatch, label, href] = match

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (isSafeInternalHref(href)) {
      parts.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:text-primary transition-colors"
        >
          {label}
        </a>
      )
    } else {
      parts.push(fullMatch)
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
      {renderMarkdownLinks(content)}
    </p>
  )
}
