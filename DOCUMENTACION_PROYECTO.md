# Documentación técnica y avance del proyecto

## 1. Identificación

- Proyecto de trabajo: **Escuela de aviación**.
- Nombre actual del minijuego: **Hasta la Luna**.
- Tipo: minijuego web de vuelo arcade, narrativo y responsive.
- Carpeta obligatoria: `D:\HTML\Escuela de aviación\`.
- Repositorio: `https://github.com/eit4nsz/Demo-0`.
- Rama principal: `main`.
- Entorno: Windows, Visual Studio Code, Git, GitHub y navegador moderno.

La aplicación se mantiene sin frameworks de interfaz ni motores externos. La edición principal se realiza con HTML, CSS y JavaScript vanilla.

## 2. Estado general

| Área | Estado |
|---|---|
| Menú e inicio | Implementado |
| Bucle con `requestAnimationFrame` | Implementado |
| Movimiento WASD y flechas | Corregido y validado en Iteración 1 |
| Movimiento táctil | Implementado; emulación móvil validada |
| Libertad horizontal y vertical visible | Implementada y validada |
| Cámara y conversión mundo/pantalla | Corregida en Iteración 1 |
| Límites, diagonales e inercia | Implementados y validados |
| Obstáculos y colisiones | Preservados y probados |
| Combustible e invulnerabilidad | Preservados y probados |
| Pausa, reanudación y reinicio | Implementados y probados |
| Escenarios, landmarks y final | Implementados |
| Responsive | Validado en tres resoluciones objetivo |
| Consola | 0 errores después de Iteración 1 |
| Build y versión autocontenida | Implementados y validados |

## 3. Tecnologías y lenguajes

| Tecnología | Uso |
|---|---|
| HTML5 | Canvas, HUD, menú, pausa, final y controles táctiles. |
| CSS3 | Diseño, overlays, responsive, estados y reducción de movimiento. |
| JavaScript vanilla ES2022+ | Entrada, física, estados, cámara, colisiones, render y API pública. |
| Canvas 2D | Render procedural del mundo, avión, tortuga, partículas y obstáculos. |
| Vite 8 | Servidor local y build de producción. |
| Node.js | Scripts de construcción. |
| Git y GitHub | Historial y repositorio remoto. |
| OpenAI Sites Vite Plugin | Integración de build/hosting ya configurada. |

Lenguajes presentes: HTML, CSS, JavaScript, JSON y Markdown. No se usan React, Vue, Angular, Unity, Godot, WebGL, librerías de física ni motores externos.

## 4. APIs del navegador

- **Canvas 2D API:** contextos, rutas, transformaciones, gradientes, texto y composición.
- **`requestAnimationFrame`:** actualización y render con `deltaTime`; el delta se limita a `0.034` para evitar saltos al volver de otra pestaña.
- **Keyboard Events:** `keydown`/`keyup` mantienen W, A, S, D, flechas, P/Escape y R.
- **Pointer Events:** `pointerdown`, `pointerup` y `pointercancel` conectan controles táctiles con el mismo estado de entrada.
- **`ResizeObserver`:** sincroniza Canvas y contenedor.
- **`devicePixelRatio`:** nitidez limitada a DPR 2 para controlar coste.
- **Page Visibility API:** pausa automática al ocultar el documento.
- **`matchMedia`:** consulta `prefers-reduced-motion`.
- **`URLSearchParams`:** vista previa del final con `?preview=ending`.
- **DOM API:** HUD, overlays, mensajes, regiones y accesibilidad.

## 5. Estructura

```text
D:\HTML\Escuela de aviación\
├── .git\
├── .openai\
│   └── hosting.json
├── assets\
├── public\
│   ├── game.js
│   └── og.png
├── scripts\
│   ├── build-standalone.mjs
│   └── build-worker.mjs
├── game.js
├── index.html
├── styles.css
├── standalone.html
├── README.md
├── DOCUMENTACION_PROYECTO.md
├── package.json
├── package-lock.json
└── vite.config.ts
```

`dist/` y `node_modules/` se generan localmente y no son fuentes para editar a mano.

## 6. Responsabilidad de archivos

- **`index.html`:** documento principal; Canvas, menú, HUD, pausa, final, mensajes y controles. Incluye favicon transparente embebido para evitar un 404 de consola.
- **`styles.css`:** presentación, layout responsive y visibilidad táctil mediante `(pointer: coarse)` o ancho máximo de 760 px.
- **`game.js`:** fuente principal con configuración, clases, física, cámara, render y API.
- **`public/game.js`:** copia generada de `game.js` usada por Vite/Sites; no se edita manualmente.
- **`standalone.html`:** entregable autocontenido generado.
- **`scripts/build-standalone.mjs`:** genera la versión autocontenida.
- **`scripts/build-worker.mjs`:** completa la salida estática.
- **`vite.config.ts`:** configura Vite y el plugin de Sites.
- **`.openai/hosting.json`:** identifica el proyecto de hosting ya asociado.

## 7. Arquitectura JavaScript

### Configuración

- `GAME_TEXT`: textos principales y narrativos.
- `CONFIG`: distancia final, altitudes, velocidad, obstáculos, combustible e invulnerabilidad.
- `SeededRandom`: secuencias deterministas para mundo y obstáculos.

### Sistemas

- **`InputManager`:** unifica WASD, flechas y táctil; no contiene física ni render.
- **`Player`:** posición, velocidad, aceleración, drag, rotación, combustible, colisiones e invulnerabilidad.
- **`Camera`:** avance del mundo, seguimiento vertical lento y shake.
- **`ObstacleManager`:** generación, actualización, limpieza y colisión mundial.
- **`ParticleSystem`:** partículas livianas de impacto y motor.
- **`WorldRenderer`:** cielo, estrellas, Luna, nubes, terreno, atmósfera y landmarks.
- **`PlaneRenderer`:** representa el estado del jugador; no controla la física.
- **`UIManager`:** HUD, mensajes, regiones y overlays.
- **`Game`:** ciclo de vida, estados, límites, progresión, render y coordinación.

## 8. Estados

```text
MENU → PLAYING ⇄ PAUSED
          ↓
        ENDING
          ↓
       GAME_OVER
          ↓
       PLAYING (reinicio)
```

La física no avanza en `MENU`, `PAUSED` ni `GAME_OVER`.

## 9. Modelo de movimiento

```text
entrada sostenida
      ↓
velocidad objetivo / aceleración
      ↓
velocidad con drag y deltaTime
      ↓
posición mundial del jugador
      ↓
cámara + límites del viewport
      ↓
world-space → screen-space
      ↓
render y colisiones alineadas
```

### Horizontal

- La cámara mantiene el avance base del mundo.
- A/D o flechas cambian la velocidad relativa del jugador.
- La autoridad se adapta al ancho del viewport.
- El avión se limita aproximadamente entre 15 % y 70 % del ancho.
- Al soltar, la velocidad relativa converge suavemente a la cámara y conserva la posición elegida.

### Vertical

- W/arriba y S/abajo aplican aceleración real sobre la altitud.
- El drag evita movimiento infinito.
- La cámara sigue lentamente para no cancelar la maniobra.
- El avión queda entre 15 % y 82 % de la altura visible y respeta límites mundiales.
- La posición inicial de 500 unidades permite una zona inferior útil desde el comienzo.
- La rotación se limita aproximadamente a ±0.48 radianes y funciona solo como feedback.

## 10. Coordenadas y colisiones

- `Player.position` está en espacio mundial.
- `Camera.x` representa el avance base del mundo.
- La X visible es el ancla del 40 % más la diferencia jugador-cámara.
- La Y visible usa la diferencia de altitud con escala `0.38`.
- Obstáculos, render y colisión usan la misma escala vertical.
- Las hitboxes siguen la posición real; una maniobra visible también cambia la trayectoria de colisión.

## 11. Sistemas preservados

- Siete tipos de obstáculos según la etapa.
- Penalización de 11 puntos de combustible por impacto.
- Invulnerabilidad temporal de 1.8 segundos.
- Shake, partículas y mensaje de colisión.
- Consumo continuo de combustible.
- Progresión y landmarks.
- Secuencia final por falta de combustible.
- Preferencia de reducir movimiento.

## 12. API pública

`window.HastaLaLuna` expone:

```js
HastaLaLuna.create(root)
HastaLaLuna.startGame()
HastaLaLuna.stopGame()
HastaLaLuna.resetGame()
HastaLaLuna.destroyGame()
HastaLaLuna.getInstance()
HastaLaLuna.GAME_TEXT
HastaLaLuna.CONFIG
```

Las clases internas permanecen encapsuladas.

## 13. Desarrollo y construcción

```powershell
cd 'D:\HTML\Escuela de aviación'
npm install
npm run dev
npm run build
npm run preview
```

El build regenera `standalone.html`, ejecuta Vite, crea `dist/`, completa la salida estática y sincroniza `public/game.js`.

## 14. Avance acumulado

### Base y vertical slice

- HTML semántico y Canvas responsive.
- Dirección artística nocturna procedural.
- Menú, HUD, pausa, mensajes y final.
- Bucle independiente de framerate.
- Entrada continua por teclado y táctil.
- Física arcade, cámara, obstáculos, colisiones y combustible.

### Mundo y contenido

- Ciudad, nubes, estrellas, Luna y atmósfera.
- Landmarks narrativos y progresión visual.
- Obstáculos variables, partículas, shake y feedback.

### Entregables

- Fuentes editables.
- Versión autocontenida y build de producción.
- Imagen social `public/og.png`.
- API pública e integración de hosting.

### Iteración 1 — Movimiento del avión

Problema real:

1. A/D cambiaban `Player.velocity.x`, pero `getPlayerScreenPosition()` fijaba la X al 40 % del viewport.
2. La cámara seguía la altitud y anticipaba la velocidad, cancelando casi todo W/S visible.
3. La altura inicial dejaba poco espacio para descender.

Solución:

- avance horizontal de cámara separado de la posición relativa del jugador;
- X visible calculada con la diferencia jugador-cámara;
- autoridad horizontal responsive y límites 15–70 %;
- seguimiento vertical lento, sin compensación de velocidad;
- aceleración, drag y máximos verticales ajustados;
- límites verticales 15–82 % sin rebote;
- escala vertical unificada en movimiento, obstáculos y colisión;
- progreso principal calculado con el avance de cámara;
- cámara del final adaptada para conservar la narrativa;
- posición inicial elevada a 500 unidades;
- favicon embebido para eliminar el único 404 de consola.

## 15. Pruebas de Iteración 1

- [x] Inicio sin errores JavaScript.
- [x] W, S, A, D y las cuatro flechas.
- [x] W+D, W+A, S+D y S+A.
- [x] Estabilización suave al soltar.
- [x] Límites horizontales y verticales.
- [x] Evasión de obstáculo reproducible.
- [x] Colisión, feedback, combustible e invulnerabilidad.
- [x] Pausa congela la física.
- [x] Reanudación sin salto violento.
- [x] Reinicio restaura posición, cámara y combustible.
- [x] Controles táctiles en emulación móvil.
- [x] Consola con 0 errores y 0 advertencias relevantes.
- [x] `npm run build` completado.

En `1366×768`, manteniendo cada control unos 0.7 segundos:

| Control | Desplazamiento visible aproximado |
|---|---:|
| W / ArrowUp | -40 a -43 px Y |
| S / ArrowDown | +42 px Y |
| A / ArrowLeft | -269 a -272 px X |
| D / ArrowRight | +261 a +269 px X |

Las diagonales registraron simultáneamente 261–269 px en X y 44–45 px en Y.

| Resolución | Resultado | Táctil |
|---|---|---|
| 390 × 844 | Movimiento, límites y render correctos | Visible |
| 1366 × 768 | Movimiento, límites y render correctos | Layout escritorio |
| 1920 × 1080 | Movimiento, límites y render correctos | Layout escritorio |

Prueba práctica: con la semilla determinista, la ruta sin maniobra colisionó y bajó combustible de 100 % a 89 %. Repitiendo con W+D se alcanzó la misma distancia sin impacto y con 100 %.

## 16. Pendientes fuera de esta iteración

- Validación adicional en dispositivo táctil físico; la emulación `390×844` pasó.
- Cualquier rediseño móvil debe ser una iteración independiente.
- Audio, escenarios, sprites y mejoras artísticas permanecen fuera de Iteración 1.
- No se inició Iteración 2.

## 17. Estado

La arquitectura conserva la separación entre entrada, física, cámara, render y UI. El movimiento permite cambiar trayectoria, recorrer zonas útiles y esquivar obstáculos sin romper colisiones, pausa, reinicio ni responsive.

**ITERACIÓN 1: COMPLETADA**
