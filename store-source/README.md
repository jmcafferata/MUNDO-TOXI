# store-source

Acá van las fotos originales de cada producto de la tienda (`toxi.media/store`).
Esta carpeta **no se commitea** (son archivos pesados). El script las optimiza con
`sharp` (local, gratis) y deja el resultado liviano en `public/store/` +
`public/data/store.json`, que sí se commitean y se sirven por el CDN de Vercel.

## Convención

```
store-source/
  remera-toxi-negra/
    1.jpg
    2.jpg
    info.json
  taza-toxi/
    1.jpg
    info.json
```

- El nombre de la carpeta es el `slug` del producto (se usa en la URL y en el JSON).
- Las imágenes se procesan en orden alfabético/numérico → nombralas `1.jpg`, `2.jpg`, etc.
  para controlar cuál aparece primero (portada).
- Atajo: si tirás una foto suelta directo en `store-source/` (sin subcarpeta), el
  script la organiza solo en su propia carpeta la próxima vez que corras el sync.
  Si tenés muchas fotos de productos distintos, ponelas sueltas en la raíz —
  **no** las metas todas juntas en una sola subcarpeta o el script las va a tratar
  como fotos de un mismo producto.
- `info.json` se autogenera la primera vez que corrés el script, con `hidden: true`.
  Completá los datos reales y sacá el `hidden` para que el producto se publique:

```json
{
  "name": "Remera TOXI",
  "price": 25000,
  "currency": "ARS",
  "description": "Remera negra oversize con logo TOXI.",
  "stock": 5,
  "hidden": false
}
```

## Uso

1. Creá la carpeta del producto y metelo las fotos.
2. Corré:
   ```
   npm run store:sync
   ```
3. La primera vez va a crear `info.json` con placeholders — completalo.
4. Volvé a correr `npm run store:sync` para publicarlo (sube las fotos que falten
   y regenera `public/data/store.json`).

El script no vuelve a procesar una imagen que no cambió (compara fecha de
modificación contra el resultado ya generado). No requiere ninguna cuenta ni
API key — todo corre local con `sharp`.
