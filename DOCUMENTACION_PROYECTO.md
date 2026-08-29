# Documentación técnica y avance del proyecto

## 1. Identificación

- Proyecto de trabajo: **Escuela de aviación**.
- Nombre público actual del minijuego: **Escuela de Aviación**.
- Tipo: minijuego web de vuelo arcade, narrativo y responsive.
- Carpeta obligatoria: `D:\HTML\Escuela de aviación\`.
- Repositorio: `https://github.com/eit4nsz/Demo-0`.
- Rama principal: `main`.
- Entorno: Windows, Visual Studio Code, Git, GitHub y navegador moderno.

La aplicación se mantiene sin frameworks de interfaz ni motores externos. La edición principal se realiza con HTML, CSS y JavaScript vanilla.

## 2. Estado general

| Área | Estado |
|---|---|
| Portada, menú e inicio | Menú game-art de hangar con cuatro opciones y paneles funcionales |
| Bucle con `requestAnimationFrame` | Implementado |
| Movimiento WASD y flechas | Corregido y validado en Iteración 1 |
| Movimiento táctil | Implementado; emulación móvil validada |
| Libertad horizontal y vertical visible | Implementada y validada |
| Cámara y conversión mundo/pantalla | Corregida en Iteración 1 |
| Límites, diagonales e inercia | Implementados y validados |
| Obstáculos y colisiones | Overhaul visual, mayor densidad, variedad y dificultad progresiva |
| Combustible e invulnerabilidad | Preservados y probados |
| Pausa, reanudación y reinicio | Implementados y probados |
| Escenarios, landmarks, aeropuerto y llegada | Implementados; viaje extendido hasta centro espacial y Luna |
| Avión comercial, piloto y tortuga pasajera | Implementados en Iteración 2; legibilidad mejorada en Iteración 4A |
| Gata negra del menú | Integrada en la escena game-art del hangar; no forma parte del gameplay |
| Vidas extra y pickups | 3 vidas iniciales, máximo 5 y escudos coleccionables |
| Dificultad progresiva | Implementada en Iteración 3 |
| Duración total | 86,092 s hasta la pantalla lunar final |
| Responsive | Validado en tres resoluciones objetivo |
| Consola | 0 errores después de la actualización game-art |
| Build y versión autocontenida | Implementados y validados |

### Parche visual game-art — Dirección A + fondo B

La selección aprobada mezcla la interfaz **Riveted Pop** de la Dirección A con el hangar pintado de la Dirección B. La traducción a producción se aplicó a todo el juego:

- menú como escenario, con carteles suspendidos y remaches en lugar de botones web;
- logo volumétrico, paneles de mantenimiento y estados hover/focus/pressed;
- HUD reconstruido como instrumentos físicos compactos;
- paleta más viva, contornos oscuros, iluminación cálida y profundidad por capas;
- avión comercial ampliado visualmente sin ampliar su hitbox, con cockpit y pasajera más legibles;
- obstáculos con silueta, borde, color y efectos de impacto más claros;
- avisos laterales y medidor de etapa para comunicar la dificultad sin saturar la escena;
- paneles funcionales de Cómo jugar, Ajustes y Créditos, incluido un espacio editable para los créditos definitivos.

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
- **`URLSearchParams`:** vistas de prueba `ending`, `obstacles`, `pickups`, `rocket` y `moon`.
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

- **`index.html`:** documento principal; escenario-menú, paneles Cómo jugar/Ajustes/Créditos, Canvas, HUD de vidas y combustible, pausa, final, mensajes y controles.
- **`styles.css`:** identidad game-art, logo volumétrico, carteles físicos, paneles de mantenimiento, responsive y visibilidad táctil.
- **`assets/images/menu-hangar-game-art.png`:** ilustración original 16:9 del menú B con hangar nocturno, avión, capitana y gata.
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
- `CONFIG`: distancia final, inicio y duraciones de llegada, altitudes, velocidad, obstáculos, combustible e invulnerabilidad.
- `getDifficulty(progress)`: curva centralizada de velocidad, separación y amplitud de obstáculos.
- `SeededRandom`: secuencias deterministas para mundo y obstáculos.

### Sistemas

- **`InputManager`:** unifica WASD, flechas y táctil; no contiene física ni render.
- **`Player`:** posición, velocidad, aceleración, drag, rotación, combustible, colisiones, invulnerabilidad y estado visual de tren/puerta/tortuga.
- **`Camera`:** avance del mundo, seguimiento vertical lento y shake.
- **`ObstacleManager`:** generación por etapas, velocidad propia, parejas espaciadas, control de repetición, trayectorias, limpieza y colisión mundial.
- **`PickupManager`:** distribución determinista, movimiento, colisión y recogida de escudos de vida extra.
- **`ParticleSystem`:** partículas livianas de impacto y motor.
- **`WorldRenderer`:** cielo, estrellas, Luna, nubes, terreno multicapa, landmarks, aeropuerto, centro espacial, superficie lunar y primer plano con parallax/luces de ruta.
- **`PlaneRenderer`:** dibuja un avión comercial original con motores, ventanas iluminadas, cockpit ampliado, piloto, tortuga pasajera, tren y puerta; representa el estado sin controlar la física.
- **`UIManager`:** HUD, mensajes, regiones y overlays.
- **`Game`:** ciclo de vida, estados, límites, progresión, render y coordinación.

## 8. Estados

```text
MENU → PLAYING ⇄ PAUSED
          ↓
       APPROACH
          ↓
        LANDING
          ↓
          TAXI
          ↓
       ARRIVED
          ↓
       TRANSFER
          ↓
        LAUNCH
          ↓
          MOON
          ↓
 PLAYING (Volver a volar)
```

`PAUSED` conserva cualquier fase activa y la restaura sin saltos. `ARRIVED` termina el desembarque, `TRANSFER` lleva a la tortuga al centro espacial, `LAUNCH` anima el cohete y `MOON` muestra el alunizaje antes del final exitoso.

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

- Siete tipos de obstáculos con dificultad escalada por `progress`, combinaciones de dos elementos y avisos anticipados.
- Tres vidas iniciales, máximo cinco y pickups de vida extra.
- Penalización de 11 puntos de combustible por impacto.
- Invulnerabilidad temporal de 1.65 segundos.
- Shake, partículas y mensaje de colisión.
- Consumo continuo de combustible.
- Progresión y landmarks.
- Aproximación, aterrizaje, taxi, estacionamiento, desembarque, traslado, lanzamiento y alunizaje.
- Combustible restante al completar una partida normal; no se fuerza a cero.
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

## 16. Iteración 2 — Avión comercial y ritmo

### Rediseño visual

El avión de hélice fue reemplazado por una aeronave comercial original dibujada completamente con Canvas 2D:

- fuselaje largo con nariz redondeada y degradado metálico;
- estabilizador vertical, estabilizador horizontal y alas barridas;
- dos turbinas bajo las alas, una en segundo plano;
- tomas de aire, brillo de motor y estelas tenues;
- ocho ventanas con iluminación cálida;
- luces roja, verde y blanca intermitente;
- estelas tenues procedentes de los motores durante el vuelo;
- escala responsive original de 82 % en pantallas estrechas y 100 % en escritorio, sustituida por el ajuste visual moderado de Iteración 4A;
- pitch visual limitado a `-0.22…0.20` radianes para una inclinación comercial creíble.

No queda ninguna hélice, marca, aerolínea ni modelo real copiado.

### Personajes

- La piloto es una mujer dentro del cockpit, con cabello negro lacio, gorra, uniforme oscuro, cuello claro, brazo al mando y reacción sutil a impactos.
- La tortuga dejó de ser piloto y aparece como pasajera en una ventana cálida del fuselaje.
- La tortuga conserva parpadeo, movimiento leve de cabeza, reacción a impactos y mirada ascendente durante el final.

### Hitbox

La hitbox no se amplió hasta cubrir toda la silueta. Permanece centrada en el fuselaje principal con radio 26, evitando penalizaciones por cola, punta de ala o nariz. Una prueba a 70 unidades no colisiona; una superposición central sí reduce combustible de 100 % a 89 % y activa 1.8 s de invulnerabilidad.

### Ritmo antes y después (registro histórico de Iteración 2)

Medición previa usando el bucle real y la fórmula de velocidad progresiva:

| Medida | Antes | Después |
|---|---:|---:|
| `CONFIG.finalDistance` | 32000 | 31500 |
| `CONFIG.cruiseSpeed` | 155 | 158 |
| Consumo base por segundo | 0.052 | 0.18 |
| Inicio → comienzo del final | 174.80 s | 169.12 s |
| Inicio → pantalla final | 186.30 s | 180.62 s |
| Combustible sin impactos al comenzar el final | 90.9 % | 69.6 % |

En Iteración 2 el recorrido duraba aproximadamente 3:01. Estos valores fueron sustituidos por la recalibración de Iteración 3 y ya no describen la versión vigente.

Los landmarks siguen basados en porcentajes. No fue necesario modificar sus posiciones: París, Egipto, Nueva York, Río, Japón y la costa conservan orden y separación, mientras atmósfera, espacio y Luna continúan usando la progresión global hasta el 92 %.

## 17. Pruebas de Iteración 2

- [x] El avión se reconoce como comercial y no tiene hélice.
- [x] Dos motores, ventanas, cockpit y luces visibles.
- [x] Piloto mujer visible dentro de la cabina.
- [x] Tortuga visible como pasajera y animada.
- [x] W, S, A, D y las cuatro flechas preservados.
- [x] W+D, W+A, S+D y S+A preservados.
- [x] Pitch visual limitado sin modificar la física.
- [x] Hitbox central justa y extremos decorativos excluidos.
- [x] Evasión de obstáculo con 99.6 % de combustible restante.
- [x] Colisión central, penalización e invulnerabilidad.
- [x] Pausa, reanudación y reinicio.
- [x] Partida completa simulada con el `Game.update` real a 60 FPS.
- [x] Registro histórico de duración a 180.62 s; comportamiento sustituido en Iteración 3.
- [x] Ciudad, París, Egipto, Nueva York, Río, Japón y costa.
- [x] Progresión posterior por atmósfera, espacio y Luna hasta el final.
- [x] Responsive en `390×844`, `1366×768` y `1920×1080`.
- [x] Controles táctiles visibles en `390×844`.
- [x] Consola con 0 errores y 0 advertencias relevantes.
- [x] `npm run build` completado.

## 18. Iteración 3 — Recorrido, dificultad y aeropuerto

### Duración y configuración

La duración se midió desde el botón de inicio —actualmente **Comenzar vuelo**— hasta la aparición visible de **Vuelo completado**, usando el juego real en navegador:

| Parámetro | Antes | Después |
|---|---:|---:|
| Duración total | 180,62 s | 84,864 s |
| `CONFIG.finalDistance` | 31500 | 14800 |
| `CONFIG.cruiseSpeed` | 158 | 174 |
| Incremento de velocidad de ruta | 30 interno | `routeSpeedBoost: 36` |
| `CONFIG.obstacleGap` | `[680, 1150]` | `[540, 1250]` |
| Inicio de llegada | 92 % | `approachAt: 86 %` |

La nueva duración reserva 17 segundos para aproximación, aterrizaje, taxi y desembarque. La partida cronometrada finalizó con 34 % de combustible pese a impactos; el valor no fue forzado a cero.

### Dificultad progresiva

`getDifficulty(progress)` produce una curva suave y centralizada:

- velocidad propia de obstáculos: 18 → 132 unidades/s;
- separación de aparición: 1250 → 540 unidades;
- amplitud de movimiento: 12 → 88 unidades;
- 0–20 %: pájaros, globos y bandadas con espacios amplios;
- 20–45 %: combinaciones ligeras y mayor velocidad;
- 45–70 %: bandadas, globos meteorológicos y tormentas;
- 70–90 %: meteoritos, satélites y trayectorias más rápidas;
- 90–100 %: obstáculos eliminados para dejar libre la aproximación.

Cada obstáculo posee `vx`, `vy`, amplitud y frecuencia. Pájaros y bandadas cruzan y cambian altura; globos y tormentas se mueven lentamente; meteoritos y satélites adquieren mayor velocidad relativa. Radio de colisión, daño e invulnerabilidad permanecen sin cambios.

### Aeropuerto y llegada

`WorldRenderer.drawAirport()` construye mediante Canvas 2D:

- pista en perspectiva con luces laterales y eje central;
- luces de aproximación;
- terminal iluminada;
- torre de control;
- hangar y siluetas urbanas nocturnas;
- calle de rodaje señalizada.

La llegada usa timers con `deltaTime`, sin cadenas de `setTimeout`:

1. `APPROACH` (3,5 s): descenso gradual, control parcial y despliegue del tren.
2. `LANDING` (4,5 s): alineación semiautomática, touchdown y humo breve de ruedas.
3. `TAXI` (4 s): desaceleración y desplazamiento hasta la terminal.
4. `ARRIVED` (5 s): parada, apertura de puerta, escalera y desembarque de la tortuga.
5. Final exitoso: textos centralizados en `GAME_TEXT` y botón **Volver a volar**.

La tortuga desaparece de su ventana al comenzar el desembarque, baja la escalera, camina por la plataforma y hace un gesto feliz. La piloto permanece en el cockpit. `prefers-reduced-motion` y la opción manual reducen humo, shake y oscilaciones accesorias.

## 19. Pruebas de Iteración 3

- [x] Partida completa real: 84,864 s (máximo solicitado: 90 s).
- [x] Ciudad, París, Egipto, Nueva York, Río, Japón y costa conservados.
- [x] Transición de gran altura a atmósfera, ciudad y aeropuerto.
- [x] Dificultad muestreada en 0 %, 30 %, 60 % y 80 %.
- [x] Obstáculos con velocidad propia, trayectorias y separación progresiva.
- [x] Ruta despejada desde 90 %.
- [x] Colisiones, pérdida de combustible e invulnerabilidad preservadas.
- [x] W, A, S, D, flechas y diagonales preservados de Iteración 1.
- [x] Avión comercial, piloto, tortuga pasajera, motores, ventanas y luces preservados de Iteración 2.
- [x] Aproximación, tren de aterrizaje, touchdown, taxi y estacionamiento.
- [x] Puerta, escalera, desembarque y gesto final de la tortuga.
- [x] Combustible no forzado a cero; 34 % en la ejecución cronometrada.
- [x] Pausa durante vuelo y aproximación; reanudación sin salto.
- [x] Reinicio completo mediante **Volver a volar**.
- [x] Responsive en `390×844`, `1366×768` y `1920×1080`.
- [x] Controles táctiles visibles en `390×844`.
- [x] Movimiento reducido validado.
- [x] Consola con 0 errores y 0 advertencias relevantes.
- [x] `npm run build` completado y `standalone.html` regenerado.

## 20. Iteración 4A — Identidad visual y cabina

### Nombre público y portada

El nombre mostrado al usuario cambió a **Escuela de Aviación** en el título HTML, metadata social, encabezado principal y textos configurables. Los nombres de la API `HastaLaLuna` se conservaron para no romper integraciones existentes.

La pantalla inicial usa la dirección B **Hangar abierto**. El escenario completo funciona como interfaz: una ilustración game-art nocturna reúne avión comercial, pista, torre, capitana y gata; el título recibe volumen, contorno y emblemas aeronáuticos; las opciones son carteles físicos suspendidos en el hangar. Incluye:

- **Comenzar vuelo** como señal principal dominante;
- **Cómo jugar**, **Ajustes** y **Créditos** como señalización secundaria;
- paneles de mantenimiento accesibles, cerrables con `Escape` y navegables por teclado;
- control funcional de movimiento reducido y control de sonido preparado;
- campos editables de créditos para completar manualmente;
- adaptación móvil que reorganiza los carteles sin convertirlos en tarjetas web.

### Avión, cockpit y pasajeros

- La escala visual usa `clamp(viewWidth / 480, 0.9, 1.08)`, un aumento moderado que no modifica la física.
- El cockpit es más amplio y luminoso; la capitana conserva gorra, cabello negro lacio y uniforme de la portada en una versión simplificada para Canvas.
- La versión de cockpit incorpora piel con degradado, corbata teal, pasador y emblema dorados, brillo ocular y reflejo suave en el cabello para mantener coherencia con la ilustración refinada.
- Las ventanas son más grandes, tienen profundidad mediante un degradado cálido y un contorno de mayor contraste.
- La ventana de la tortuga mide 15 × 12,5 unidades y su personaje recibió caparazón, cabeza y ojo más legibles.
- La hitbox sigue centrada en el fuselaje con radio 26; no creció con la silueta visual.

### Validación

- [x] Branding **Escuela de Aviación** en portada, HTML y metadata.
- [x] Piloto y gata visibles en la bienvenida.
- [x] Botón de inicio y transición al vuelo.
- [x] Capitana y tortuga legibles dentro del avión.
- [x] Avión comercial, motores, luces y aterrizaje preservados.
- [x] Hitbox de radio 26 y sistemas de movimiento sin cambios.
- [x] Responsive en `390×844`, `1366×768` y `1920×1080`.
- [x] Consola con 0 errores y 0 advertencias relevantes.
- [x] `npm run build` completado y `standalone.html` regenerado.

## 21. Actualización game-art — fases 1 a 5

### Fase 1 — Menú principal

- Dirección B implementada con `assets/images/menu-hangar-game-art.png`.
- Escenario asimétrico con foreground, midground y background.
- Logo de videojuego integrado en la escena.
- Hover, foco, pulsación, teclado y modales funcionales.
- Créditos listos para edición manual, sin contenido definitivo inventado.

### Fase 2 — Overhaul visual del gameplay

- Cielo con mayor contraste, brillos atmosféricos y transición espacial.
- Tres capas de terreno con parallax independiente.
- Ciudad con ventanas cálidas y luces de horizonte animadas.
- Landmarks con paletas propias, contornos y acentos luminosos.
- Avión con doble franja, emblema original, bordes, reflejos y turbinas visibles.

### Fase 3 — Obstáculos y dificultad

Valores actuales:

| Parámetro | Antes | Actual |
|---|---:|---:|
| `CONFIG.obstacleGap` | 540 → 1250 | 365 → 980 |
| `CONFIG.obstacleSpeed` | 18 → 132 | 38 → 172 |
| `CONFIG.obstacleAmplitude` | 12 → 88 | 16 → 108 |

`getDifficulty(progress)` también calcula `pairChance` e `visualIntensity`. Desde 34 % puede formar parejas separadas vertical y horizontalmente; nunca usa más de dos elementos por combinación y deja limpia la aproximación desde 90 %. `ObstacleManager.selectType()` evita rachas visuales de un mismo tipo. Pájaros, globos, tormentas, meteoritos y satélites recibieron siluetas, volumen y detalles propios.

### Fase 4 — Vidas extra

- `CONFIG.startingLives = 3` y `CONFIG.maxLives = 5`.
- Una colisión consume una vida, mantiene 11 puntos de daño de combustible y respeta 1,8 s de invulnerabilidad.
- `PickupManager` crea escudos luminosos `+1` con semilla determinista.
- El HUD representa las cinco ranuras mediante corazones llenos y vacíos.
- Si la reserva está completa, el pickup no se consume.

### Fase 5 — Aeropuerto, centro espacial, cohete y Luna

La ruta final es:

```text
APPROACH → LANDING → TAXI → ARRIVED
                              ↓
                          TRANSFER
                              ↓
                           LAUNCH
                              ↓
                             MOON
```

- `ARRIVED`: puerta, escalera y desembarque.
- `TRANSFER`: transporte terrestre desde el avión hasta el centro espacial.
- `LAUNCH`: cohete original con la tortuga visible en la ventanilla, llama y ascenso gradual.
- `MOON`: superficie lunar, Tierra al fondo, cohete posado y paseo final de la tortuga.
- Texto final centralizado en `GAME_TEXT`: **Misión completada** / **La tortuga llegó a la Luna**.
- `prefers-reduced-motion` y el ajuste manual eliminan rebotes, estelas accesorias y pulsaciones fuertes.

Para conservar el máximo de 90 s, `finalDistance` pasó de `14800` a `12600` y las fases usan `3,2 + 4 + 3,2 + 4,2 + 4,5 + 5,5 + 4` segundos. La ejecución completa finalizó en **86,092 s de tiempo de juego**.

### Validación de la actualización

- [x] Menú y tres paneles funcionales.
- [x] Movimiento, cámara y avión comercial preservados.
- [x] Obstáculos más numerosos, variados y progresivos.
- [x] Pickup visible, recogida 2 → 3 vidas y mensaje de confirmación.
- [x] Colisión 3 → 2 vidas, combustible 100 % → 87 % en la ventana probada e invulnerabilidad activa.
- [x] Partida completa hasta `MOON`: 86,092 s.
- [x] Todos los landmarks permanecen antes de `APPROACH`.
- [x] Centro espacial, lanzamiento, alunizaje y pantalla final.
- [x] Responsive en `390×844`, `1366×768` y `1920×1080`.
- [x] Movimiento reducido en la secuencia espacial.
- [x] Consola sin errores ni advertencias relevantes.
- [x] `npm run build` y `standalone.html` actualizados.

## 22. Pendiente conocido

- Validación adicional en un dispositivo táctil físico; la emulación `390×844` pasó.

## 23. Estado

El proyecto conserva el movimiento de Iteración 1 y el avión comercial de Iteración 2. La versión vigente se presenta como **Escuela de Aviación**, usa un menú game-art integrado en un hangar, amplía el detalle y profundidad del mundo, incorpora obstáculos progresivos y vidas extra, y concluye la ruta aeropuerto–centro espacial–Luna en 86,092 segundos.

**ACTUALIZACIÓN GAME-ART — FASES 1 A 5: COMPLETADA**
