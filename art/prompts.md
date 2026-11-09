# Arte de Angry Cats Need Naps Too

Todo el arte se generó con IA, con GPT Image 2.5 en FLORA, y después se redujo a píxeles reales con `scripts/pixelate.mjs`.

## Estilo común

> High-detail 16-bit retro game style, perfectly crisp square pixels on a consistent pixel grid, no anti-aliasing, no blur, limited palette, clean dark outline, three to four tones of fur shading, small eye highlights, pink inner ears, visible whiskers. All cats have identical size, proportions, pose and art style. No text, no border, no floor, no shadow.

## Gatos sentados

Base: *Original pixel art game sprite sheet of cats, each sitting and facing forward, evenly spaced in one row on a plain flat solid pale cream background.*

| Gato | Pelaje |
|---|---|
| Hana | Orange tabby with green eyes and darker orange stripes |
| Luca | Chocolate brown tabby with lighter chest and amber eyes |
| Freya | White and ginger calico with blue eyes |
| Sasha | Charcoal gray with amber eyes and a small white chest patch |
| Noor | Charcoal black with bright yellow eyes |
| Anouk | Cream with dark brown face mask, ears and paws, and blue eyes |
| Emre | Black and white tuxedo with white paws and amber eyes |
| Ilse | Pure white, fluffy and long-haired, with gold eyes |
| Kai | Warm ginger with bold dark orange spots and amber eyes |
| Aroha | Silver-blue gray with green eyes and subtle darker stripes |

## Gatos durmiendo

Base: *Original pixel art game sprite sheet of cats sleeping, each curled up in a round loaf with eyes closed and tail wrapped around, evenly spaced in one row on a plain flat solid pale cream background, side-facing.* Mismos pelajes, sin el color de ojos.

## Íconos

*Three small icons on a plain flat solid pale cream background: a golden cat food tin can with a small fish silhouette, a dark purple cat paw print, and the head of an angry black cat seen from the front with yellow slanted eyes and small fangs.*

## Cómo se procesa

```bash
node scripts/pixelate.mjs entrada.png salida nombre1,nombre2 --cell=6
```

## Salas

Cada sala se generó primero en su nivel máximo con este estilo:

> High-detail 16-bit style, perfectly crisp square pixels on a consistent pixel grid, no anti-aliasing, no blur, limited palette, three to four tones of shading, clean readable shapes. No characters, no animals, no text, no logos.

- **Entrada:** the cozy entrance of a small cat shelter, side view interior, wooden door, welcome mat, window with evening light, shelf with cat food cans, potted plant, soft cushion.
- **Patio:** the cozy fenced backyard of a small cat shelter, golden afternoon light, big leafy tree, wooden bench, flower beds, birdbath, cat climbing post.
- **Dormitorio:** the snug bedroom of a small cat shelter at night, lavender walls, starry window with a full moon, soft round rug, plush cat beds, hanging lamp.

Los niveles 2, 1 y 0 se editaron a partir del nivel máximo, pidiendo mantener la misma sala, cámara y disposición, y retirando objetos hasta dejarla abandonada.

```bash
node scripts/pixelate.mjs entrada.png salida sala-3 --cell=4 --opaque
```
