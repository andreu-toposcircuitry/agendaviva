# Contribuir a Agenda Viva VO

Gràcies per l'interès en contribuir a Agenda Viva VO! Aquest document explica com pots ajudar.

## Codi de conducta

- Tracta tothom amb respecte
- Accepta crítiques constructives
- Centra't en el que és millor per a la comunitat
- Mostra empatia cap a altres membres de la comunitat

## Com pots contribuir

### 1. Proposar activitats

La manera més fàcil de contribuir és proposant activitats noves a través del formulari web a `/proposa`.

### 2. Reportar errors

Si trobes informació incorrecta, desactualitzada o duplicada:

1. Comprova que no estigui ja reportat
2. Crea un issue a GitHub amb:
   - URL de l'activitat
   - Descripció de l'error
   - Informació correcta (si la tens)
   - Font de la informació correcta

### 3. Millorar la documentació

La documentació sempre es pot millorar:

- Corregir errors ortogràfics o gramaticals
- Afegir exemples
- Clarificar seccions confuses
- Traduir a altres idiomes (castellà, anglès)

### 4. Contribuir codi

#### Setup inicial

```bash
git clone https://github.com/andreu-toposcircuitry/agendaviva.git
cd agendaviva
npm install
cp .env.example .env
# Edita .env amb les teves credencials
npm run dev -w apps/web
```

#### Workflow

1. **Fork** el repositori
2. **Crea una branca** per la teva feature:
   ```bash
   git checkout -b feature/nom-descriptiu
   ```
3. **Fes els canvis** seguint les guies d'estil
4. **Testa** els canvis localment
5. **Commit** amb missatges clars:
   ```bash
   git commit -m "Add: descripció breu del canvi"
   ```
6. **Push** a la teva branca:
   ```bash
   git push origin feature/nom-descriptiu
   ```
7. **Obre un Pull Request** amb:
   - Descripció clara del canvi
   - Screenshots si és canvi visual
   - Link a issue relacionat (si n'hi ha)

#### Missatges de commit

Utilitza prefixos clars:

- `Add:` per a noves funcionalitats
- `Fix:` per a correccions d'errors
- `Update:` per a actualitzacions
- `Refactor:` per a refactoritzacions
- `Docs:` per a canvis en documentació
- `Style:` per a canvis d'estil (CSS, formatació)
- `Test:` per a afegir/modificar tests

Exemples:
```
Add: search by municipality filter
Fix: ND score not displaying correctly
Update: README with new setup instructions
Docs: add contributing guidelines
```

### 5. Millorar l'agent classificador

L'agent d'IA és crucial per a la qualitat del directori. Pots ajudar:

- Millorant el prompt (a `packages/agent/src/prompt.ts`)
- Afegint exemples de classificació
- Testejant amb casos reals i reportant errors
- Ajustant els criteris ND

Quan facis canvis en el prompt:
1. Testa amb diversos casos (mínim 10)
2. Documenta els resultats
3. Justifica els canvis proposats

### 6. Feedback sobre puntuacions ND

Si has participat en una activitat:

1. Confirma si la puntuació ND és correcta
2. Proporciona detalls específics sobre:
   - Mida real dels grups
   - Nivell de soroll
   - Flexibilitat del ritme
   - Actitud dels monitors
   - Possibilitat d'adaptacions
3. Envia via formulari web o issue a GitHub

## Guies d'estil

### TypeScript/JavaScript

- Utilitza TypeScript sempre que sigui possible
- Prefereix `const` sobre `let`
- Utilitza funcions arrow per callbacks
- Comenta codi complex
- Tipus explícits en funcions públiques

```typescript
// ✓ Bo
export function calculateNDScore(indicators: NDIndicators): number {
  const { positive, negative } = indicators;
  return Math.max(1, Math.min(5, 3 + positive.length - negative.length));
}

// ✗ Dolent
export function calc(ind) {
  return Math.max(1, Math.min(5, 3 + ind.pos.length - ind.neg.length));
}
```

### Astro/Svelte

- Components en PascalCase
- Props amb tipus TypeScript
- Utilitza semantic HTML
- Accessibilitat (ARIA labels on cal)

```svelte
<!-- ✓ Bo -->
<script lang="ts">
  export let score: number;
  export let label: string;
</script>

<div role="meter" aria-label={label} aria-valuenow={score}>
  {score}/5
</div>

<!-- ✗ Dolent -->
<script>
  export let s;
  export let l;
</script>

<div>{s}/5</div>
```

### CSS/Tailwind

- Utilitza Tailwind sempre que sigui possible
- Classes semàntiques per components reutilitzables
- Mobile-first (breakpoints: `md:`, `lg:`)

```html
<!-- ✓ Bo -->
<div class="card p-4 md:p-6 hover:shadow-lg transition-shadow">
  <h2 class="text-xl font-bold mb-2">Títol</h2>
</div>

<!-- ✗ Dolent -->
<div style="padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <h2 style="font-size: 20px; font-weight: bold;">Títol</h2>
</div>
```

### Català

- Utilitza català correcte (consulta TERMCAT si cal)
- Evita barbarismes
- Utilitza apòstrofs correctament (`l'activitat`, no `la activitat`)
- Accents correctes (`és`, `està`, `perquè`)

## Tests

Abans de fer un PR:

1. **Comprova que l'app funciona localment**
   ```bash
   npm run dev -w apps/web
   ```

2. **Verifica que compila sense errors**
   ```bash
   npm run build -w apps/web
   ```

3. **Executa el linter**
   ```bash
   npm run lint
   ```

## Revisió de Pull Requests

Els PRs seran revisats considerant:

1. **Funcionalitat**: El canvi fa el que diu que fa?
2. **Qualitat del codi**: Segueix les guies d'estil?
3. **Tests**: Funciona correctament?
4. **Documentació**: Està documentat si cal?
5. **Impacte**: No trenca res existent?

## Prioritats actuals

Consulta els [issues a GitHub](https://github.com/andreu-toposcircuitry/agendaviva/issues) etiquetats com:

- `good first issue`: Bones tasques per començar
- `help wanted`: Necessitem ajuda aquí
- `priority`: Alta prioritat

## Preguntes?

- Obre un issue a GitHub
- Contacta per email: agendaviva.vo@weirdwiredhumans.cat

## Llicència

En contribuir, acceptes que les teves contribucions es llicenciïn sota MIT License.
