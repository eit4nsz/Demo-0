# Especificación común — parche game-art y dificultad

## Producto y objetivo

Escuela de Aviación es un minijuego web 2D de vuelo arcade construido con HTML, CSS, JavaScript vanilla y Canvas 2D. El jugador controla un avión comercial conducido por una piloto de cabello negro; una tortuga viaja como pasajera y una gata negra funciona como personaje acompañante en el menú. El viaje recorre varios escenarios, esquiva obstáculos, recoge vidas y termina con una secuencia narrativa que continúa desde el aeropuerto hasta la Luna. El objetivo de esta exploración es definir una actualización visual y jugable coherente que haga que todo el producto se sienta como un juego casual ilustrado terminado, no como una demo técnica o una interfaz web superpuesta sobre un Canvas.

La referencia Plants vs. Zombies se usa exclusivamente para extraer principios: formas expresivas, jerarquía inmediata, objetos reconocibles por silueta, materiales con volumen, humor visual moderado, colores que separan capas y peligro anticipable. No se copiarán personajes, plantas, zombis, jardines, logotipo, composición ni assets. La identidad resultante será aeronáutica, nocturna, aventurera y propia.

## Audiencia y uso

El público es amplio y no especializado: jugadores casuales en navegador, tanto en escritorio como en móvil. La interfaz debe comprenderse a un metro de distancia en laptop y seguir siendo legible en 390 × 844. La pantalla principal debe invitar a jugar en pocos segundos; el HUD debe informar sin parecer dashboard; los obstáculos deben distinguirse del fondo antes de entrar en zona de colisión. La interacción principal seguirá siendo teclado, flechas y controles táctiles. Se preservan física, estados, recorrido, aeropuerto y final existentes salvo los parámetros explícitos de dificultad.

## Contenido obligatorio

- Menú principal con Escuela de Aviación, Comenzar vuelo, Cómo jugar, Ajustes y Créditos.
- Piloto y gata coherentes con el universo gráfico.
- Paneles funcionales con lenguaje de objetos físicos, no tarjetas corporativas.
- HUD con altitud, distancia, vidas, combustible y pausa.
- Avión comercial con piloto y tortuga legibles, sin agrandar su hitbox.
- Mundo con fondo, plano medio y primer plano diferenciados.
- Landmarks internacionales, aeropuerto, centro espacial y Luna preservados.
- Obstáculos actuales y pickups, rediseñados para lectura visual y dificultad progresiva.
- Estados claros de hover, focus, pressed, impacto, invulnerabilidad y recolección.
- Reducción de movimiento y responsive.

## Tono y dirección artística

La emoción buscada combina aventura nocturna, taller de aviación, cuento ilustrado y energía arcade. Las formas deben ser redondeadas o ligeramente irregulares, con contorno azul tinta, sombras por bloques, luces cálidas, metales pintados y pequeñas marcas de uso. La paleta base puede usar ultramarino, petróleo, crema, turquesa, ocre y coral, pero cada dirección debe organizarla de modo diferente. Se evitan glassmorphism, tarjetas SaaS, simetría rígida, tipografía editorial premium y ornamentación técnica genérica. La textura debe ser sutil y eficiente: grano o manchas precalculadas, no ruido costoso por frame.

## Formato de las tres direcciones

Cada propuesta será un HTML completo e independiente en `design-demos/`, diseñado a 1440 × 900 y acompañado por una captura PNG del mismo tamaño. Las tres versiones usarán el contenido real del juego y el asset actual del hangar solo como materia prima interna; deben diferenciarse estructuralmente, no ser simples cambios de color. Cada demo mostrará: una reinterpretación de menú/HUD, una ventana de gameplay con avión, obstáculos y pickups, y una pequeña visualización de la curva de dificultad. No se conectará todavía con la lógica de producción. Son tableros interactivos de dirección para seleccionar el lenguaje del parche.

## Cinco preguntas de forma

1. **Rol narrativo:** una pantalla de selección que a la vez demuestra cómo se verá el viaje.
2. **Distancia:** laptop a un metro, con reducción legible a móvil vertical.
3. **Temperatura:** aventurera, cálida, juguetona y segura; nunca infantil en exceso.
4. **Capacidad:** un foco principal, cuatro acciones de menú, un recorte de gameplay y una curva visual; sin rellenar con estadísticas decorativas.
5. **Motivo visual:** la señalización y los instrumentos de una escuela de vuelo convertidos en objetos expresivos del mundo.

## Restricciones técnicas y de aceptación

No introducir frameworks ni dependencias pesadas. En la implementación posterior se animarán principalmente `transform` y `opacity`; los botones tendrán presión física breve y los diálogos transiciones inferiores a 300 ms. La dificultad escalará suavemente con `progress`, mantendrá hitboxes justas y despejará la aproximación final. Ningún cambio puede romper controles, pausa, reinicio, aterrizaje, final lunar, responsive o build. La dirección elegida deberá implementarse con commits pequeños, pruebas automatizadas y revisión visual en 390 × 844, 1366 × 768 y 1920 × 1080.
