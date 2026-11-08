# Entiende tu seguro de gastos médicos

Página web estática y educativa: una persona sin experiencia en seguros elige una
cuenta de hospital y ve, en pesos, cuánto sale de su bolsa y cuánto paga la
aseguradora. Incluye dos seguros precargados (MediMaxx Integral de Allianz y Alfa
Medical Íntegro de SMNYL) y permite añadir otros.

- Sin backend, sin cuentas, sin analytics. Se abre con doble clic o se sirve estático.
- Los seguros que agrega el usuario viven en `localStorage`.
- Una sola pieza de lógica (la fórmula) y todo lo demás es contenido.

La cuenta va de $10,000 a $2,000,000: si se escribe algo fuera de ese rango, la caja
se ajusta al límite y la página lo avisa (nunca calcula con un número distinto al que
muestra).

## Uso local

```bash
open index.html          # macOS: doble clic equivalente
```

Opcional, con servidor local (útil para probar en el teléfono desde la misma red):

```bash
python3 -m http.server 8080
```

## Tests

```bash
node --test tests/simulador.test.js
```

Los tests comparan la fórmula contra números calculados a mano a partir de las
pólizas: apendicitis, terapia intensiva con y sin tope de coaseguro, cuenta menor al
deducible, coaseguro 0% y cuenta que rebasa la suma asegurada.

## Publicar en GitHub Pages

El sitio es estático: basta con subir el contenido de esta carpeta a un repositorio y
activar Pages en la rama por defecto (`/` como raíz).

```bash
git remote add origin git@github.com:<usuario>/<repo>.git
git push -u origin main
# GitHub → Settings → Pages → Source: Deploy from a branch → main / (root)
```

No hace falta build ni `.nojekyll` (no hay carpetas con guion bajo).

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Todo el contenido educativo en cinco pasos |
| `styles.css` | Paleta cálida, móvil primero, sin framework |
| `simulador.js` | La fórmula pura (corre en navegador y en Node) |
| `seguros.js` | Seguros precargados + los del usuario en `localStorage` |
| `escenarios.js` | Casos frecuentes y sus costos estimados |
| `app.js` | Une estado, controles y pantalla |
| `tests/simulador.test.js` | La fórmula contra casos conocidos |

## La fórmula

```
pago de entrada = min(deducible, cuenta)
tu parte del resto = min(% × (cuenta − deducible), tope)   // sin tope si no viene
paga la aseguradora = min(cuenta − (pago de entrada + tu parte del resto), suma asegurada)
```

Si la cuenta rebasa la suma asegurada, la aseguradora paga su tope y la diferencia se
muestra como tercer renglón del desglose ("Arriba del máximo asegurado").

## Actualizar los seguros precargados

Edita `PRECARGADOS` en `seguros.js`. Los datos salen del cuadro comparativo de las
propuestas (deducible, coaseguro, tope, suma asegurada y prima anual con IVA).

El tope de coaseguro de SMNYL no viene en la propuesta: se simula **sin tope** y la
interfaz lo advierte. Si el agente lo confirma, cambia `topeCoaseguro: null` por el
número.

## Límites conocidos

- Los costos de hospital son estimados típicos de hospital privado en México (2025), no
  cotizaciones. La web lo dice en el pie.
- El campo de cuenta va de $10,000 a $2,000,000. Con los dos seguros precargados
  ($170–180 M de suma) ese techo no se rebasa; con un seguro propio de suma baja, sí, y
  la web lo avisa.
- No modela periodos de espera, preexistencias, gastos no cubiertos ni deducible por
  accidente. Es una calculadora de las cuatro reglas grandes, no un dictamen.
