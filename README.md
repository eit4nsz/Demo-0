# Escuela de Aviación

Minijuego 2D de vuelo hecho con HTML5, CSS3, JavaScript vanilla y Canvas. Una capitana recorre el mundo de noche con una tortuga como pasajera y aterriza en un aeropuerto iluminado. La bienvenida presenta a la piloto junto a su elegante gata negra.

## Abrir el juego

No necesitas instalar nada para jugar:

1. Abre `index.html` en un navegador moderno. Mantén `styles.css` y `game.js` junto al HTML.
2. Para la versión más fácil de compartir, abre `standalone.html`; contiene estilos y JavaScript en el mismo archivo.

El proyecto también incluye herramientas opcionales de desarrollo. Si ya tienes Node.js, `npm run dev` abre un servidor local y `npm run build` genera la carpeta `dist/`. Node no es necesario para jugar.

## Controles

- `W` / `↑`: elevar el morro y ganar altura.
- `S` / `↓`: bajar el morro y perder altura.
- `A` / `←`: reducir el avance y desplazarse hacia atrás.
- `D` / `→`: acelerar y avanzar.
- `P` / `Escape`: pausar o continuar.
- `R`: reiniciar desde la pantalla final.
- En pantallas táctiles aparecen controles discretos automáticamente.

## Estructura

- `index.html`: portada ilustrada, interfaz, menús, HUD y controles táctiles.
- `styles.css`: identidad visual, personajes CSS de bienvenida y presentación responsive.
- `game.js`: motor, vuelo, cámara, mundo procedural, obstáculos, colisiones y render Canvas.
- `standalone.html`: copia autocontenida generada desde los tres archivos anteriores.
- `assets/`: carpetas preparadas para imágenes, sprites, audio y fuentes futuras.
- `scripts/build-standalone.mjs`: regenera `standalone.html`.

El código de `game.js` se separa por responsabilidades: `InputManager`, `Player`, `Camera`, `ObstacleManager`, `ParticleSystem`, `WorldRenderer`, `PlaneRenderer`, `UIManager` y `Game`.

## Personalización rápida

### Textos

Edita `GAME_TEXT` al principio de `game.js`. Ahí están el título conceptual y las dos líneas del final. Los textos del menú se encuentran también en `index.html` para que sigan siendo visibles incluso si JavaScript está desactivado.

### Duración, llegada y combustible

En `CONFIG`, al principio de `game.js`:

- `finalDistance`: longitud total del viaje; un valor mayor alarga la partida.
- `approachAt`: porcentaje en el que comienza la aproximación al aeropuerto.
- `cruiseSpeed`: velocidad base.
- `routeSpeedBoost`: incremento gradual de velocidad durante el recorrido.
- `arrivalDurations`: duración de aproximación, aterrizaje, taxi y desembarque.
- `collisionFuelLoss`: combustible perdido en una colisión.

El consumo normal se ajusta dentro de `Player.update()`. El combustible no se fuerza a cero al final: una partida limpia llega con reserva y las colisiones siguen restando combustible.

### Dificultad y obstáculos

- `getDifficulty(progress)` centraliza velocidad propia, separación y amplitud de movimiento.
- `CONFIG.obstacleGap`, `obstacleSpeed` y `obstacleAmplitude` definen sus rangos.
- `ObstacleManager.chooseType()` decide qué aparece en cada capa de altura.
- `ObstacleManager.update()` controla progresión, trayectorias, generación adelantada, reciclaje y colisiones.
- `OBSTACLE_INFO` contiene los radios de colisión; son deliberadamente menores que el dibujo visual.

### Landmarks

La lista `WorldRenderer.landmarks` define posición, nombre y tipo. Para agregar uno:

1. Añade un objeto `{ at: 0.40, name: "Nombre", type: "miLugar" }` en orden ascendente.
2. Añade el dibujo de `miLugar` en `WorldRenderer.drawLandmarkShape()`.

`at` es un valor normalizado de `0` a `1`, no una coordenada gigante.

### Sustituir dibujos por sprites

Coloca PNG o WebP en `assets/sprites/`. Los puntos de sustitución principales son:

- `PlaneRenderer.render()`, `drawCockpit()` y `drawPassengerTurtle()` para avión y personajes.
- `Game.drawObstacle()` para obstáculos.
- `WorldRenderer.drawLandmarkShape()` para landmarks.

Puedes precargar imágenes al crear `Game` y dibujarlas con `ctx.drawImage()` sin cambiar la física ni las colisiones.

## Integración en otra web

La instancia está encapsulada en `#turtle-flight-game`. La API pública mínima conserva su nombre histórico por compatibilidad; el nombre visible del juego es **Escuela de Aviación**:

```js
HastaLaLuna.startGame();
HastaLaLuna.stopGame();
HastaLaLuna.resetGame();
HastaLaLuna.destroyGame();
```

Para montar el juego en otro momento usa `HastaLaLuna.create(elementoContenedor)`. `destroyGame()` cancela la animación, observadores y listeners globales.

## Regenerar `standalone.html`

Después de editar `index.html`, `styles.css` o `game.js`, ejecuta:

```bash
node scripts/build-standalone.mjs
```

El archivo generado funciona abriéndolo directamente y no consulta recursos externos.

Para revisar rápidamente la aproximación, aterrizaje, taxi y desembarque durante desarrollo, añade `?preview=ending` a la URL y pulsa **Comenzar vuelo**. Este modo no modifica la partida normal.
