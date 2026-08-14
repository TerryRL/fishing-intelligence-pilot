type FishIconProps = {
  species?: string | null
  size?: number
  className?: string
}

function family(species: string) {
  const s = species.toLowerCase()
  if (s.includes('pike') || s.includes('musk')) return 'long'
  if (s.includes('catfish') || s.includes('bullhead')) return 'catfish'
  if (s.includes('sunfish') || s.includes('bluegill') || s.includes('crappie') || s.includes('rock bass')) return 'panfish'
  if (s.includes('trout') || s.includes('salmon') || s.includes('char')) return 'trout'
  if (s.includes('carp') || s.includes('drum') || s.includes('bowfin')) return 'deep'
  if (s.includes('whitefish') || s.includes('cisco') || s.includes('smelt')) return 'silver'
  if (s.includes('walleye') || s.includes('sauger') || s.includes('perch')) return 'perch'
  if (s.includes('bass')) return 'bass'
  return 'standard'
}

export default function FishIcon({ species, size = 38, className = '' }: FishIconProps) {
  const kind = family(species ?? '')
  const long = kind === 'long'
  const panfish = kind === 'panfish'
  const deep = kind === 'deep'
  const catfish = kind === 'catfish'
  const trout = kind === 'trout'
  const perch = kind === 'perch'
  const bass = kind === 'bass'

  const bodyPath = long
    ? 'M22 48 C34 32 72 31 94 43 C108 36 119 28 132 22 L127 43 L142 50 L127 57 L132 78 C119 72 108 64 94 57 C70 69 36 67 22 52 Z'
    : panfish
      ? 'M24 50 C37 24 77 20 101 36 C114 32 126 23 137 19 L132 42 L145 50 L132 58 L137 81 C126 77 114 68 101 64 C75 80 37 76 24 52 Z'
      : deep
        ? 'M22 50 C36 27 79 24 105 39 C116 35 128 27 140 23 L134 43 L146 50 L134 57 L140 77 C128 73 116 65 105 61 C78 77 37 73 22 52 Z'
        : 'M22 50 C39 33 78 30 103 42 C116 37 127 29 139 25 L134 44 L146 50 L134 56 L139 75 C127 71 116 63 103 58 C77 70 39 67 22 52 Z'

  const bodyFill = trout ? '#79b7a2' : perch ? '#9ba85f' : bass ? '#668d62' : panfish ? '#69a7a0' : catfish ? '#7f8f8c' : long ? '#7e9c68' : '#6f9eb0'
  const stripe = trout ? '#c0d4bd' : perch ? '#536444' : bass ? '#354f42' : '#d2e1df'

  return (
    <svg className={className} width={size} height={Math.round(size * 0.62)} viewBox="0 0 160 100" role="img" aria-label={species ? `${species} icon` : 'Fish icon'}>
      <path d={bodyPath} fill={bodyFill} stroke="#d7ecec" strokeWidth="3" strokeLinejoin="round" />
      <path d="M55 35 C63 22 78 18 92 31" fill="none" stroke="#d7ecec" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <path d="M56 65 C68 78 83 80 94 65" fill="none" stroke="#d7ecec" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      {perch && <><path d="M63 34 L58 65 M76 31 L72 68 M89 34 L86 65" stroke={stripe} strokeWidth="5" opacity=".75" /></>}
      {bass && <path d="M48 51 C66 46 85 46 105 51" fill="none" stroke={stripe} strokeWidth="5" opacity=".75" />}
      {trout && <><circle cx="62" cy="45" r="2.7" fill="#7e4b45" /><circle cx="75" cy="54" r="2.7" fill="#7e4b45" /><circle cx="88" cy="43" r="2.7" fill="#7e4b45" /></>}
      {catfish && <><path d="M31 52 Q12 61 5 70 M31 48 Q12 40 5 31" fill="none" stroke="#d7ecec" strokeWidth="2.5" strokeLinecap="round" /></>}
      <circle cx={long ? 38 : 41} cy={long ? 45 : 43} r="4.5" fill="#061522" stroke="#f5fbff" strokeWidth="2" />
      <path d={long ? 'M23 50 L38 53' : 'M24 50 L40 53'} stroke="#061522" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
