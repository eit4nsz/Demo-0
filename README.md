# Escuela de Aviación

Minijuego 2D de vuelo hecho con HTML5, CSS3, JavaScript vanilla y Canvas. Una capitana recorre el mundo de noche con una tortuga como pasajera; tras aterrizar, la tortuga continúa hacia un centro espacial y completa la misión en la Luna. El menú principal es un hangar ilustrado game-art con la piloto y su elegante gata negra.

La dirección visual actual combina **señalética remachada y expresiva** con un **aeródromo nocturno pintado**: contornos gruesos, colores cálidos, paneles físicos, volumen, textura sutil y una jerarquía propia de videojuego arcade.

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

- `index.html`: menú principal integrado en el hangar, paneles funcionales, HUD de combustible/vidas y controles táctiles.
- `styles.css`: identidad game-art, carteles físicos, modales de mantenimiento, responsive y presentación general.
- `assets/images/menu-hangar-game-art.png`: escenario original del menú B con hangar, avión, capitana y gata.
- `game.js`: motor, vuelo, cámara, mundo procedural, obstáculos, pickups, colisiones y secuencia aeropuerto–Luna.
- `standalone.html`: copia autocontenida generada desde los tres archivos anteriores.
- `assets/`: carpetas preparadas para imágenes, sprites, audio y fuentes futuras.
- `scripts/build-standalone.mjs`: regenera `standalone.html`.

El código de `game.js` se separa por responsabilidades: `InputManager`, `Player`, `Camera`, `ObstacleManager`, `ParticleSystem`, `WorldRenderer`, `PlaneRenderer`, `UIManager` y `Game`.

## Personalización rápida

### Textos

Edita `GAME_TEXT` al principio de `game.js`. Ahí están el título conceptual y las dos líneas del final. Los textos del menú se encuentran también en `index.html` para que sigan siendo visibles incluso si JavaScript está desactivado.

### Duración, llegada y combustible

En `CONFIG`, al principio de `game.js`:

- `finalDistance`: longitud total del viaje aéreo; actualmente `12600` para mantener la misión completa por debajo de 90 s.
- `approachAt`: porcentaje en el que comienza la aproximación al aeropuerto.
- `cruiseSpeed`: velocidad base.
- `routeSpeedBoost`: incremento gradual de velocidad durante el recorrido.
- `arrivalDurations`: duración de aproximación, aterrizaje, taxi, desembarque, traslado, lanzamiento y escena lunar.
- `collisionFuelLoss`: combustible perdido en una colisión.

El consumo normal se ajusta dentro de `Player.update()`. El combustible no se fuerza a cero al final: una partida limpia llega con reserva y las colisiones siguen restando combustible.

La misión completa fue cronometrada en **86,092 s de tiempo de juego**, desde Comenzar vuelo hasta la pantalla lunar final.

### Dificultad y obstáculos

- `getDifficulty(progress)` centraliza velocidad propia, separación, amplitud, intensidad visual y probabilidad de parejas.
- `CONFIG.obstacleGap` usa actualmente `300–820`, `obstacleSpeed` `52–195` y `obstacleAmplitude` `18–96`.
- `ObstacleManager.chooseType()` decide qué aparece en cada capa de altura.
- `ObstacleManager.update()` controla progresión, trayectorias, generación adelantada, parejas escalonadas/puertas seguras, reciclaje y colisiones.
- `OBSTACLE_INFO` contiene los radios de colisión; son deliberadamente menores que el dibujo visual.
- El HUD identifica las etapas `DESPEGUE`, `RUTA`, `ALTURA`, `INTENSA` y `APROXIMACIÓN`, y las flechas de aviso anticipan amenazas que entran por el borde derecho.

### Vidas y pickups

- El vuelo comienza con 3 vidas y admite un máximo de 5.
- Cada choque consume una vida disponible y mantiene la penalización de combustible.
- `PickupManager` distribuye escudos de vida extra a lo largo de la ruta.
- La aproximación elimina obstáculos y pickups para conservar un aterrizaje limpio.

### Secuencia final

La máquina de estados continúa después de `ARRIVED`: `TRANSFER` lleva a la tortuga al centro espacial, `LAUNCH` anima el despegue del cohete y `MOON` completa el alunizaje antes de mostrar **Misión completada**.

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

Vistas de prueba disponibles: `?preview=ending`, `?preview=obstacles`, `?preview=pickups`, `?preview=rocket` y `?preview=moon`. Solo aceleran la revisión visual y no modifican la partida normal.
