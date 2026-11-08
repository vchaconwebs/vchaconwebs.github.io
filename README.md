# Portfolio · Víctor Chacón Cintado

Web estática con una escena 3D de partículas (Three.js, cargado desde CDN). Al hacer scroll las
partículas se transforman: núcleo con anillos → nudo → ola → doble hélice → candado → galaxia.

## Archivos
- `index.html`: todo el contenido (textos, proyectos, enlaces).
- `styles.css`: diseño. Los colores están arriba del todo en `:root`.
- `main.js`: escena 3D, animaciones, cursor, tarjetas 3D, cuenta atrás y botón de copiar correo.
  Las formas están en la lista `SHAPES` (posición, tamaño y giro de cada una).
- `assets/img/`: portadas y capturas de los juegos.
- `versiones/obra/`: la primera versión (concepto "obra en curso"), por si quieres recuperarla.

Tiene que abrirse desde un servidor (local o publicado). Si abres `index.html` con doble clic, el 3D no carga.

## Añadir un proyecto nuevo
En `index.html`, dentro de `<div class="cards">`, copia un bloque `<article class="card">…</article>`,
cambia el texto, el enlace y la imagen (guárdala en `assets/img/`).
Con 4 tarjetas la fila queda completa; si añades más, mejor que sean 6 u 8.

## Verla en local
```
python -m http.server 5173
```
y abre http://localhost:5173

## Publicarla gratis
- **GitHub Pages**: crea un repo `vchaconwebs.github.io`, sube estos archivos y en Settings → Pages
  elige la rama `main`. Quedará en https://vchaconwebs.github.io
- **Netlify / Cloudflare Pages**: arrastra la carpeta entera a su panel ("Deploy manually").
- Si compras un dominio (p. ej. victorchacon.dev), se conecta desde cualquiera de los dos.
