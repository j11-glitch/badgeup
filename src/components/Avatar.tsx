const GRADIENTS = [
  ['#f5b53d', '#e0761f'],
  ['#4f8cff', '#7b4dff'],
  ['#2fc27a', '#138a8a'],
  ['#ff5f8f', '#b43fd6'],
  ['#35c6e8', '#2f6fdc'],
  ['#ff8a4c', '#e2415a'],
]

/** A round avatar with the child's initial, coloured from their name. */
export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const hash = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const [from, to] = GRADIENTS[hash % GRADIENTS.length]
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.45, backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
