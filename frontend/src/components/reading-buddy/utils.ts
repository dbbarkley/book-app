export function parseMessage(content: string): { pageRef: string | null; isSpoiler: boolean; text: string } {
  let rest = content
  let pageRef: string | null = null
  let isSpoiler = false
  const pageMatch = rest.match(/^\[p\. ?(\d+)\] ?/)
  if (pageMatch) { pageRef = pageMatch[1]; rest = rest.slice(pageMatch[0].length) }
  if (rest.startsWith('[!SPOILER]')) { isSpoiler = true; rest = rest.slice(10) }
  return { pageRef, isSpoiler, text: rest.trim() }
}
