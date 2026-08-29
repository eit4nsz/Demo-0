# Escuela de Aviación

Minijuego 2D arcade de vuelo creado con HTML5, CSS3, JavaScript vanilla y Canvas 2D. Una capitana conduce un avión comercial alrededor del mundo con Tortu Eitan como pasajero, mientras una gata negra acompaña los momentos clave de la aventura.

La entrega final usa una dirección **game-art 2D original**: aeródromo nocturno pintado, señalética remachada, contornos expresivos, colores vivos, volumen, textura ligera y una interfaz integrada en el mundo del juego.

## Jugar

- Abre `index.html` en un navegador moderno.
- Abre `standalone.html` para usar la versión autocontenida, sin recursos externos.
- Con Node.js instalado, usa `npm run dev` para desarrollo y `npm run build` para regenerar `standalone.html` y `dist/`.

## Controles

- `W` / `↑`: subir.
- `S` / `↓`: bajar.
- `A` / `←`: desplazarse hacia la izquierda.
- `D` / `→`: desplazarse hacia la derecha.
- `P` / `Escape`: pausar o continuar.
- `R`: reiniciar desde la pantalla final.
- En pantallas táctiles aparecen controles direccionales.

## Experiencia de juego

- Menú principal ilustrado con cuatro accesos funcionales: **Comenzar vuelo**, **Cómo jugar**, **Ajustes** y **Créditos**.
- Vuelo continuo con inercia moderada, cámara, landmarks internacionales, aeropuerto y misión espacial.
- Dificultad progresiva centralizada por avance: más velocidad, movimiento y combinaciones de obstáculos, con una aproximación final despejada.
- Tres vidas iniciales y un máximo de cinco. Las vidas se representan con vacas aladas que transportan corazones.
- Los pickups de vida muestran **“¡Te amuuuuuuuuu!”** al recogerse.
- Tras una colisión, la gata advierte: **“Ten mucho cuidado, también hay baches en el cielo”**.
- El cohete llega a la Luna vacío y el epílogo revela a Tortu Eitan todavía en la Tierra.

## Estructura

- `index.html`: menú, paneles, Canvas, HUD, pausa, final y controles táctiles.
- `styles.css`: identidad game-art, señalética, HUD físico, responsive y reducción de movimiento.
- `game.js`: configuración, entrada, física, cámara, obstáculos, pickups, colisiones, render y estados.
- `assets/images/menu-hangar-game-art.png`: escenario original del menú principal.
- `public/game.js`: copia generada de `game.js` para el build.
- `standalone.html`: versión autocontenida generada.
- `scripts/build-standalone.mjs`: genera el entregable autocontenido.
- `scripts/build-worker.mjs`: completa la salida estática de producción.
- `DOCUMENTACION_PROYECTO.md`: arquitectura y estado técnico final.

`dist/` y `node_modules/` son directorios generados y no se editan manualmente.

## Arquitectura

El código conserva responsabilidades separadas:

- `InputManager`: teclado y controles táctiles.
- `Player`: posición, velocidad, combustible, vidas e invulnerabilidad.
- `Camera`: avance, seguimiento y shake.
- `ObstacleManager`: dificultad, generación, movimiento y colisiones.
- `PickupManager`: distribución y recogida de vidas extra.
- `ParticleSystem`: efectos livianos.
- `WorldRenderer`: escenarios, landmarks, aeropuerto, centro espacial, Luna y epílogo terrestre.
- `PlaneRenderer`: avión comercial, piloto y Tortu Eitan pasajero.
- `UIManager`: HUD, mensajes y overlays.
- `Game`: bucle, estados y coordinación.

## Configuración principal

En `CONFIG`, al inicio de `game.js`:

- `finalDistance`: `12600`.
- `cruiseSpeed`: `174`.
- `routeSpeedBoost`: `36`.
- `obstacleGap`: `300–820`.
- `obstacleSpeed`: `52–195`.
- `obstacleAmplitude`: `18–96`.
- `startingLives`: `3`.
- `maxLives`: `5`.
- `arrivalDurations`: tiempos de aproximación, aterrizaje, taxi, desembarque, traslado, lanzamiento, Luna y epílogo.

La duración estimada del recorrido completo es de aproximadamente **89,4 segundos de tiempo de juego**. El combustible no se fuerza a cero al terminar.

## Secuencia final

```text
PLAYING → APPROACH → LANDING → TAXI → ARRIVED
        → TRANSFER → LAUNCH → MOON → EPILOGUE → final
```

El avión aterriza y Tortu Eitan desembarca. La misión espacial continúa, pero el cohete llega vacío a la Luna. El epílogo vuelve a la Tierra, muestra a la tortuga junto a la gata y cierra con el mensaje final solicitado.

## Textos y créditos

Los textos narrativos principales están centralizados en `GAME_TEXT`. Los créditos finales del panel son:

- **Piloto del avión comercial:** Ali.
- **Pasajero designado demo 0:** Tortu Eitan.

## API pública

El nombre interno histórico se conserva por compatibilidad; el nombre visible es **Escuela de Aviación**:

```js
HastaLaLuna.startGame();
HastaLaLuna.stopGame();
HastaLaLuna.resetGame();
HastaLaLuna.destroyGame();
```

Para montar otra instancia usa `HastaLaLuna.create(elementoContenedor)`.
