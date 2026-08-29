# Documentación técnica — Escuela de Aviación

## 1. Identificación y alcance

- **Nombre público:** Escuela de Aviación.
- **Tipo:** minijuego web arcade/runner aéreo 2D, narrativo y responsive.
- **Ruta:** `D:\HTML\Escuela de aviación\`.
- **Repositorio:** `https://github.com/eit4nsz/Demo-0`.
- **Rama:** `main`.

El proyecto usa HTML, CSS y JavaScript vanilla. No depende de React, Vue, Angular, Unity, Godot, motores de física ni frameworks de interfaz.

## 2. Estado final

| Área | Implementación |
|---|---|
| Menú principal | Aeropuerto nocturno game-art, señalética física y cuatro paneles funcionales |
| Movimiento | WASD, flechas, diagonales, inercia, límites y `deltaTime` |
| Cámara | Avance mundial, libertad local, seguimiento y shake |
| Avión | Aeronave comercial original con la piloto Ali y Tortu Eitan pasajero |
| Mundo | Landmarks, profundidad por capas, aeropuerto, centro espacial, Luna y Tierra final |
| Obstáculos | Dificultad progresiva, trayectorias propias, parejas justas y advertencias |
| Vidas | 3 iniciales, máximo 5, vacas aladas con corazones y pickups |
| Colisiones | Pérdida de vida/combustible, invulnerabilidad, partículas y aviso de la gata |
| Llegada | Aproximación, aterrizaje, taxi, desembarque, misión espacial y epílogo terrestre |
| Responsive | Menú, HUD, Canvas y controles táctiles adaptables |
| Accesibilidad | Foco visible, regiones vivas y reducción de movimiento |
| Distribución | Build de Vite y `standalone.html` autocontenido |

## 3. Tecnologías y APIs

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura, Canvas, menú, paneles, HUD y controles |
| CSS3 | Dirección game-art, responsive, estados y accesibilidad |
| JavaScript ES2022+ | Física, estados, cámara, colisiones, render y API pública |
| Canvas 2D | Mundo, avión, personajes, obstáculos, pickups y efectos |
| Vite 8 | Servidor local y build de producción |
| Node.js | Scripts de build |
| Git/GitHub | Control de versiones y remoto |

APIs del navegador: Canvas 2D, `requestAnimationFrame`, Keyboard Events, Pointer Events, `ResizeObserver`, Page Visibility, `matchMedia`, DOM y regiones `aria-live`.

## 4. Estructura de entrega

```text
D:\HTML\Escuela de aviación\
├── .openai\hosting.json
├── assets\images\menu-hangar-game-art.png
├── public\game.js
├── public\og.png
├── scripts\build-standalone.mjs
├── scripts\build-worker.mjs
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

`dist/` y `node_modules/` son generados. `public/game.js` y `standalone.html` se regeneran con `npm run build`.

## 5. Arquitectura

- **`GAME_TEXT`:** textos narrativos y final.
- **`CONFIG`:** recorrido, velocidades, dificultad, combustible, vidas y duraciones.
- **`getDifficulty(progress)`:** curva normalizada de velocidad, separación, amplitud e intensidad.
- **`InputManager`:** teclado y controles táctiles.
- **`Player`:** movimiento, combustible, vidas, invulnerabilidad y estado visual.
- **`Camera`:** desplazamiento mundial, seguimiento vertical y shake.
- **`ObstacleManager`:** generación por etapa, movimiento, reciclaje y colisiones.
- **`PickupManager`:** distribución, movimiento y recogida de vidas extra.
- **`ParticleSystem`:** partículas de motor, impacto y ambiente.
- **`WorldRenderer`:** escenarios, aeropuerto, centro espacial, Luna y epílogo terrestre.
- **`PlaneRenderer`:** avión comercial, cockpit, piloto, tortuga, tren y puerta.
- **`UIManager`:** HUD, vacas de vida, mensajes, overlays y regiones accesibles.
- **`Game`:** bucle, máquina de estados, secuencias y coordinación.

## 6. Movimiento y dificultad

```text
input sostenido → aceleración → velocidad con drag y deltaTime
→ posición mundial → cámara y límites → world-space/screen-space → render
```

El render representa el estado del jugador y no controla la física. `progress`, normalizado entre `0` y `1`, alimenta una dificultad suave:

- 0–20 %: despegue accesible.
- 20–45 %: ruta ligera.
- 45–70 %: dificultad media.
- 70–90 %: tramo intenso pero evitable.
- 90–100 %: aproximación despejada.

Configuración principal:

- `finalDistance`: `12600`.
- `cruiseSpeed`: `174`.
- `routeSpeedBoost`: `36`.
- `obstacleGap`: `300–820`.
- `obstacleSpeed`: `52–195`.
- `obstacleAmplitude`: `18–96`.
- `collisionFuelLoss`: `11`.
- `invulnerabilitySeconds`: `1.65`.

Las hitboxes son menores que las siluetas. La dificultad aumenta mediante movimiento, frecuencia y patrones, no mediante mayor daño.

## 7. Vidas, pickups y avisos

- `startingLives`: `3`; `maxLives`: `5`.
- Cada vida del HUD es una vaca alada que transporta un corazón.
- El pickup reutiliza la identidad visual y conserva una hitbox justa.
- Al recoger una vida aparece **“¡Te amuuuuuuuuu!”**.
- Una colisión consume una vida, resta combustible, activa invulnerabilidad y muestra a la gata diciendo **“Ten mucho cuidado, también hay baches en el cielo”**.
- Los avisos usan timers basados en `deltaTime`.
- Con reducción de movimiento se eliminan oscilaciones no esenciales.

## 8. Máquina de estados y final

```text
MENU → PLAYING ⇄ PAUSED
          ↓
APPROACH → LANDING → TAXI → ARRIVED
          ↓
TRANSFER → LAUNCH → MOON → EPILOGUE
          ↓
pantalla final → PLAYING
```

El avión llega al aeropuerto, aterriza, estaciona y permite que Tortu Eitan baje. La misión espacial continúa: el cohete despega sin pasajero visible, llega vacío a la Luna y el epílogo vuelve a la Tierra. Allí aparecen Tortu Eitan, su equipaje y la gata con el mensaje **“La tortuga nunca llegará a la luna”**.

El combustible no se fuerza a cero. La duración total estimada es de aproximadamente **89,4 s de tiempo de juego**.

| Fase | Segundos |
|---|---:|
| Aproximación | 3,2 |
| Aterrizaje | 4,0 |
| Taxi | 3,2 |
| Desembarque | 4,2 |
| Traslado | 4,5 |
| Lanzamiento | 5,5 |
| Luna | 2,3 |
| Epílogo terrestre | 5,0 |

## 9. Menú, créditos y textos

El hangar funciona como menú. **Comenzar vuelo**, **Cómo jugar**, **Ajustes** y **Créditos** son controles funcionales. Ajustes permite reducir movimiento.

Créditos finales:

- **Piloto del avión comercial:** Ali.
- **Pasajero designado demo 0:** Tortu Eitan.

Los textos narrativos principales están centralizados en `GAME_TEXT`.

## 10. Build y validación

```bash
npm run build
```

El comando sincroniza `public/game.js`, regenera `standalone.html`, ejecuta Vite y produce la salida estática.

Checklist final:

- menú y cuatro accesos funcionales;
- movimiento, diagonales, pausa, reinicio y controles táctiles;
- dificultad, colisiones e invulnerabilidad;
- vacas aladas en HUD y pickups;
- mensajes de vaca y gata;
- aeropuerto, misión espacial, Luna vacía y epílogo terrestre;
- responsive en `390×844`, `1366×768` y `1920×1080`;
- consola sin errores JavaScript relevantes;
- build y versión autocontenida correctos.

## 11. API pública

El nombre histórico se conserva internamente para no romper integraciones:

```js
HastaLaLuna.startGame();
HastaLaLuna.stopGame();
HastaLaLuna.resetGame();
HastaLaLuna.destroyGame();
HastaLaLuna.create(elementoContenedor);
```

El branding visible es **Escuela de Aviación**.
