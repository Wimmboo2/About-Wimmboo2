import { KeyHint, KeyHints } from '../components/KeyHint.jsx'
import { useEscBack, useTransitionNav } from '../lib/transition.js'

// Stub for githubMode: 'page'. Fill this in later.
export default function GithubStub() {
  useEscBack()
  const { back } = useTransitionNav()
  return (
    <main className="page">
      <h1 className="sr-only">GitHub</h1>
      <KeyHints>
        <KeyHint keys={['ESC']} label="BACK" onClick={back} />
      </KeyHints>
    </main>
  )
}
