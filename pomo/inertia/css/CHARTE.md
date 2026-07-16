# Charte graphique Pomo

Toutes les couleurs de l'application passent par des **tokens sémantiques**. On ne
nomme jamais une couleur par sa teinte (`bg-green-500`, `text-gray-400`) mais par son
rôle (`bg-primary`, `text-muted`). C'est ce qui permet au thème sombre de fonctionner
sans dupliquer les composants, et concentre les décisions de contraste en un seul endroit.

## Où vit quoi

| Fichier | Rôle |
|---|---|
| `vite.config.ts` | Associe chaque rôle à une palette Tailwind (`primary: 'green'`…) |
| `inertia/css/app.css` | Choisit **la nuance** de chaque token, calibrée pour WCAG AA |
| `inertia/composables/use_theme.ts` | Bascule clair / sombre |

## Les couleurs

| Rôle | Palette | Usage |
|---|---|---|
| `primary` | green | Couleur de marque : actions principales, échéances, sélection, focus |
| `secondary` | blue | Actions secondaires, liens, informations de contexte (ex. `ListBadge`) |
| `success` | green | Task terminée |
| `warning` | amber | Task en cours |
| `error` | red | Suppression, erreurs de formulaire |
| `neutral` | slate | Textes, fonds, bordures |

## Règle de contraste

Le **500 de Nuxt UI n'est pas accessible sur fond clair** (blanc sur `green-500` = 2.3:1,
il en faut 4.5). La charte pointe donc `--ui-primary` & co. sur le **700 en thème clair**
et le **400 en thème sombre**. Concrètement : `bg-primary`, `text-primary` et
`ring-primary` sont conformes partout, sans avoir à y penser.

Seuils visés (WCAG 2.1 niveau AA) :

- **4.5:1** pour le texte courant ;
- **3:1** pour les éléments d'interface : bordures de champs (`border-accented`) et
  anneaux de focus.

## Vocabulaire des tokens

**Fonds** — `bg-default` (page, cartes) · `bg-muted` (fond de section) · `bg-elevated`
(éléments en relief) · `bg-accented` · `bg-inverted`.

**Textes**, du plus discret au plus marqué :

| Token | Usage | Contrainte |
|---|---|---|
| `text-dimmed` | Texte décoratif, états vides | ⚠️ Uniquement sur `bg-default` / `bg-muted` |
| `text-muted` | Intitulés de section, texte secondaire | Partout |
| `text-toned` | Libellés de champs | Partout |
| `text-default` | Texte courant | Partout |
| `text-highlighted` | Titres | Partout |

**Bordures** — `border-default` (séparateurs décoratifs) · `border-accented`
(**champs de formulaire** : contraste 3:1 garanti) · `border-primary` (élément actif).

## Recettes

**Bouton principal**
```html
class="bg-primary text-inverted hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary"
```

**Badge / chip** — la variante `soft` par défaut (`bg-primary/10 text-primary`) plafonne
à 4.3:1 en clair, sous le seuil. On force donc la nuance du texte :
```html
class="bg-primary/10 text-primary-800 dark:text-primary-300"
```
C'est la seule situation où l'on écrit une nuance chiffrée, et elle reste exprimée dans
le vocabulaire de la charte (`primary-800`), jamais en `green-800`.

**Champ de formulaire** — utiliser la classe `.input`, ou reprendre :
```html
class="border border-accented bg-default text-default placeholder:text-dimmed focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
```
Tout champ doit avoir un `<label for>` associé — un `placeholder` n'est pas un libellé.

## Ce qui est interdit

- Les palettes brutes : `bg-green-500`, `text-gray-400`, `bg-white`, `text-white`
  (utiliser `bg-default` / `text-inverted`).
- `text-dimmed` sur `bg-elevated` ou `bg-accented` (tombe à 4.3:1).
- Les couleurs inventées dans les props Nuxt UI : `color="green"` n'existe pas,
  c'est `color="primary"` ou `color="success"`.

## Vérifier

Les contrastes ne sont **pas** vérifiés automatiquement : c'est une relecture manuelle.
Avant de changer une nuance dans `app.css`, mesurer la paire concernée (par ex. avec le
[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)) et viser
4.5:1 pour du texte, 3:1 pour de l'UI — **dans les deux thèmes**.

Attention : Tailwind 4 exprime ses palettes en OKLCH et les a resaturées par rapport à
la v3 (`green-500` est passé de `#22c55e` à `#00c950`). Les valeurs de contraste qui
traînent en ligne pour « Tailwind green-600 » ne sont donc plus les bonnes ; partir de
la couleur réellement calculée par le navigateur (DevTools > Computed).

Pour repérer une couleur brute oubliée :

```bash
grep -rnE --include='*.vue' \
  '\b(bg|text|border|ring)-(green|gray|red|amber|blue|slate|white|black)(-[0-9]{2,3})?\b' inertia
```
