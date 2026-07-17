import { test } from 'node:test'
import assert from 'node:assert/strict'
import { run } from './shell.mjs'

test('run n interprète AUCUN métacaractère shell', () => {
  // Le cas qui compte : cet outil passe des noms de paquets venus du registre npm.
  // Si un shell s'intercalait, cette chaîne exécuterait whoami. Ici elle doit ressortir telle quelle.
  const { code, stdout } = run(['echo', '$HOME; whoami && rm -rf /tmp/x'])

  assert.equal(code, 0)
  assert.equal(stdout.trim(), '$HOME; whoami && rm -rf /tmp/x')
})

test('run ne lève pas sur un exit code non nul, il le rend', () => {
  const { code } = run(['false'])

  assert.equal(code, 1, 'un échec doit être une donnée, pas une exception')
})

test('run rend un code non nul plutôt que de lever quand la commande n existe pas', () => {
  const { code } = run(['commande-qui-nexiste-absolument-pas-42'])

  assert.notEqual(code, 0)
})

test('run transmet input sur stdin', () => {
  const { code, stdout } = run(['cat'], { input: 'bonjour' })

  assert.equal(code, 0)
  assert.equal(stdout, 'bonjour')
})

test('run transmet les variables d environnement', () => {
  const { stdout } = run(['sh', '-c', 'echo "$MA_VAR"'], { env: { MA_VAR: 'valeur-test' } })

  assert.equal(stdout.trim(), 'valeur-test')
})
