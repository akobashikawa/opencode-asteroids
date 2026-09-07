---
description: Crea un git worktree en .worktrees/<nombre> sin cambiar de directorio.
agent: build
---

Crea un worktree de git y no hagas nada más.

1. El nombre propuesto es `$1`. Si está vacío, pregunta al usuario por el
   nombre con la tool de preguntas y usa su respuesta.
2. Convierte el nombre propuesto en uno válido para directorio y rama de git:
   - Trim, minúsculas y sin acentos (p. ej. `á` -> `a`).
   - Sustituye espacios y `_` por `-`.
   - Elimina los caracteres no válidos: `~ ^ : ? * [ ] \ ..` y los puntos
     barridos iniciales/finales (`.`, `-`, `/`).
   - Colapsa `-` repetidos.
   Ejemplo: `Skins Globales de Juego` -> `skins-globales-de-juego`.
3. Pide confirmación al usuario mostrando el nombre convertido (y el original
   si cambió). Si no confirma, termina sin crear nada.
4. Ejecuta exactamente: `git worktree add .worktrees/<nombre>` usando el
   nombre confirmado.
5. Reporta la salida del comando y termina.

Reglas estrictas:
- No cambies de directorio (ningún `cd`).
- No ejecutes ningún otro comando ni edites ningún archivo (solo este
   comando se puede modificar si el usuario lo pide).
