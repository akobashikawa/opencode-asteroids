# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Recoge las cápsulas de poder —velocidad para duplicar tu empuje, escudo para absorber tres impactos, disparo triple para lanzar 3 balas en abanico— y caza la estrella fugaz que cruza la pantalla a toda velocidad y destruye el OVNI que aparece para bombardear tu nave.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `C`       | Cambiar skin de la nave |

## Puntuación

| Asteroide      | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 500    |
| OVNI           | 300    |

Con la nave **morada** todos los puntos se duplican.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: cápsula cyan con rayo que sueltan los asteroides destruidos; duplica el empuje de la nave durante 5 s (barra de tiempo restante en el HUD)
- Power-up **Escudo**: cápsula verde que sueltan los asteroides destruidos; otorga una carga (máx. 3) que absorbe un impacto de bala enemiga, asteroide, estrella fugaz u OVNI, destruyéndolo en el proceso (iconos de carga en el HUD)
- Power-up **Disparo triple**: cápsula magenta con abanico; durante 5 s cada disparo lanza 3 balas en abanico de ±15° (barra de tiempo restante en el HUD)
- **Estrella fugaz**: asteroide dorado con estela que cruza la pantalla cada 8–15 s; da 500 puntos al destruirlo, pero también destruye la nave al chocar
- **OVNI**: enemigo rojo que aparece cada 12–18 s con rumbo errático y bombardea a la nave durante ~12 s, cada vez con mejor puntería; da 300 puntos al destruirlo y también muere si choca contra un asteroide
- **Skins de nave**: pulsa `C` en cualquier momento para ciclar entre 5 naves (clásica, neón, ámbar, rubí y morada), cada una con su propia forma, color de trazo y llama del propulsor; la **morada** es el doble de grande que la original (más hitbox y escudo acordes) a cambio de recibir el doble de puntos; la elección se guarda en `localStorage` y sobrevive recargas
