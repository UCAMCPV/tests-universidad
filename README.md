# Mis tests de universidad

Web de estudio en español para asignaturas del Grado en Ingeniería Informática. Combina resúmenes, tests de autoevaluación con explicaciones y ejercicios resueltos de Kotlin.

Está hecha con HTML, CSS y JavaScript sin frameworks, dependencias externas, backend ni paso de compilación. Las preguntas se definen dentro de cada página HTML y comparten un único motor de tests.

## Contenido

| Asignatura | Material disponible |
| --- | --- |
| Administración de Bases de Datos | Resúmenes y tests de los temas 1 (fundamentos), 2 (Oracle y ecosistema de datos) y 3 (arquitectura de un SGBD, apartados 3.0–3.2), más la guía de estudio del primer parcial (temas 1–4): 300 preguntas guiadas de seis tipos en 13 etapas, con solucionario comentado, diagramas, formulario y autoevaluación. |
| Aplicaciones para Dispositivos Móviles | Resumen y test del tema 2 (Kotlin), más 16 ejercicios resueltos. |
| Ingeniería del Conocimiento | Resúmenes y tests de los temas 1, 1.1, 2, 2.1, 2.2, 2.3 y 2.4, más un examen parcial de 30 preguntas y un simulacro de 30 preguntas con su guía de estudio. |
| Calidad de Software | Resúmenes y tests de los temas 1 (concepto de calidad del software) y 2 (técnicas de revisión, secciones 2.0–2.5), más el banco guiado del primer parcial: 300 preguntas en 13 etapas, con solucionario, 30 diagramas interactivos, formulario y autoevaluación. |
| Administración de Sistemas | Resúmenes y tests de los temas 1 (sistemas de información) y 2 (virtualización). |
| Desarrollo de Aplicaciones Distribuidas I | Apuntes del primer parcial (hilos, sockets, HTTP y FTP), el primer parcial real resuelto, talleres con 12 ejercicios y un examen de ejemplo. No son tests de opción múltiple: cada pregunta se resuelve con «Ver solución». |
| Soluciones Informáticas para la Empresa | Resúmenes y tests de los temas 1 (software empresarial y comercio digital, secciones 1.1–1.9, con los requisitos de la Tarea 1) y 2 (ERP, CRM e integración de sistemas empresariales, secciones 2.1–2.9). |

Los materiales se basan en los apuntes de las asignaturas. Conviene contrastar las respuestas con los apuntes oficiales; el examen parcial de Ingeniería del Conocimiento contiene respuestas interpretadas a partir de los apuntes, no un solucionario oficial.

## Ejecutar en local

Desde la raíz del repositorio, con Python 3 instalado:

```bash
python3 -m http.server 8000
```

Abre <http://localhost:8000> en un navegador con JavaScript habilitado. Detén el servidor con `Ctrl+C`.

También puedes abrir `index.html` directamente, aunque el almacenamiento al usar URLs `file://` depende del navegador. Usar un servidor local proporciona un origen estable para guardar el progreso.

### Acceso

Las páginas muestran una pantalla de contraseña gestionada por `assets/auth.js`. La clave se define en la constante `CODE` como códigos de carácter. Al entrar, la autorización se guarda en `sessionStorage`; el botón **Bloquear** la elimina.

Esta pantalla es únicamente disuasoria: la comprobación ocurre en el navegador y tanto el contenido como la clave están en los archivos públicos. No proporciona autenticación real ni protege información privada.

## Uso de los tests

1. Selecciona una asignatura en la portada y abre el resumen o el test.
2. Responde una pregunta para ver la corrección y su explicación. La respuesta queda bloqueada hasta repetirla o reiniciar el test.
3. Usa los filtros **Todas**, **Pendientes** y **Falladas**, o activa el orden aleatorio de preguntas.
4. Pulsa **Repetir las falladas** para volver a responder solo las incorrectas conservando los aciertos.
5. Al completar el test aparece el resultado total y el desglose por categoría.

Las opciones se barajan por defecto. El examen parcial conserva el orden original de las opciones para mantener el significado de respuestas como «A y B». El botón **Reiniciar test** requiere una segunda pulsación en cuatro segundos y borra las respuestas de ese test.

La interfaz incluye modo claro y oscuro, navegación por secciones y ejercicios de Kotlin con soluciones desplegables y copia de código.

### Progreso y preferencias

Los datos se guardan en el navegador, sin cuentas ni sincronización entre dispositivos:

| Almacenamiento | Clave | Contenido |
| --- | --- | --- |
| `localStorage` | `tu-test:<id>` | Respuestas, orden de opciones, orden de preguntas y filtro de cada test. |
| `localStorage` | `tu-sum:<id>` | Resumen de progreso mostrado en la portada. |
| `localStorage` | `tu-guia:<id>` | Respuestas de cada intento, primeros aciertos, preguntas dudosas y ficha de la guía guiada. |
| `localStorage` | `tu-theme` | Preferencia de tema claro u oscuro. |
| `localStorage` | `tu-open` | Asignaturas desplegadas en la portada. |
| `sessionStorage` | `tu-gate` | Acceso concedido en la sesión de la pestaña. |

El progreso depende del navegador y del origen utilizado: cambiar de dominio, puerto o dispositivo no lo transfiere. Borrar los datos del sitio elimina el progreso. Si el navegador impide el almacenamiento local, los tests pueden utilizarse, pero el progreso no se conserva.

## Estructura

```text
.
├── index.html                  # Catálogo de asignaturas y progreso
├── assets/
│   ├── app.js                  # Tema, barra superior y utilidades de almacenamiento
│   ├── auth.js                 # Pantalla de acceso y bloqueo de sesión
│   ├── test.js                 # Motor compartido de autoevaluación
│   ├── guia.js                 # Motor de guías guiadas (huecos, relacionar, diagramas, ordenar…)
│   └── styles.css              # Estilos comunes y diseño adaptable
├── ABD/                        # Administración de Bases de Datos
│   └── guia-t1-4/              # Datos (data.js) e imágenes de la guía de los temas 1–4
├── Moviles/                    # Kotlin: resumen, test y ejercicios
├── IngenieriaConocimiento/     # Resúmenes, tests y examen parcial
├── CalidadSoftware/            # Resúmenes y tests de calidad del software
├── Sistemas/                   # Resúmenes, tests y apuntes en Unidad1/*.md
├── DAD1/                       # Apuntes, primer parcial, talleres y examen de ejemplo
└── SIE/                        # Resúmenes y tests de Soluciones Informáticas para la Empresa
```

Los archivos Markdown de `Sistemas/Unidad1/` son apuntes adicionales; no hay un proceso automático que los convierta en las páginas HTML.

## Añadir o editar contenidos

Para actualizar un resumen o ejercicio, edita su HTML. Para añadir un tema, toma como base una página de la misma asignatura, ajusta los títulos, enlaces y `data-crumb`, y registra los enlaces en el array `SUBJECTS` de `index.html`.

### Definir un test

Cada página de test necesita un contenedor `<div id="app"></div>` y un objeto `window.TEST` antes de cargar `assets/test.js`:

```html
<div id="app"></div>
<script>
window.TEST = {
  id: "asignatura-tema-3",
  cats: ["Conceptos básicos"],
  qs: [
    {
      cat: 0,
      t: "¿Cuánto es 2 + 2?",
      o: ["4", "3", "5", "6"],
      e: "La suma de dos y dos es cuatro."
    }
  ]
};
</script>
<script src="../assets/test.js"></script>
```

- `id`: identificador único usado para guardar el progreso. Debe coincidir con el campo `test` del enlace en `SUBJECTS`.
- `cats`: nombres de las categorías.
- `qs`: preguntas; `cat` es el índice de categoría empezando en cero, `t` el enunciado, `o` las opciones y `e` la explicación.
- `c`: índice opcional de la respuesta correcta dentro de `o`; por defecto es `0`.
- `shuffle: false`: propiedad opcional del test para conservar el orden de las opciones.

Incluye también `styles.css`, `app.js` y `auth.js` en la cabecera, siguiendo las páginas existentes. `app.js` debe cargarse antes del motor para que el progreso se guarde. Ajusta las rutas relativas según la carpeta de la página.

Los enunciados, opciones y explicaciones admiten HTML y se insertan directamente en la página: utiliza solo contenido de confianza. Si cambias el orden o el significado de las preguntas de un test existente, cambia su `id` para evitar reutilizar respuestas guardadas de la versión anterior. Actualiza también los contadores escritos en la portada y en la página del tema.

### Guías guiadas

`ABD/abd-guia-t1-4.html` usa `assets/guia.js` en lugar del motor de tests. Los datos están en `ABD/guia-t1-4/data.js` (`window.GUIA`), generados a partir del PDF de la guía, y las figuras en `ABD/guia-t1-4/img/` (`pNNN.webp` para el diagrama de la pregunta y `pNNN-sol.webp` para el resuelto). Cada pregunta tiene un tipo `t` (`test`, `calc`, `huecos`, `rel`, `diag` u `ord`), su respuesta en `a` y el texto del solucionario en `r` (respuesta) y `w` (por qué). La página define en `window.GUIA_CONF` el `id` de progreso, la carpeta de imágenes y el tiempo total.

La guía se recorre por etapas con navegación por `#etapa-N`, `#formulario` y `#repaso`. Cada etapa admite dos intentos. La nota se cuenta por opción, no por pregunta: cada hueco, relación o casilla acertada vale un punto, y cada pregunta de test o cálculo, uno. La autoevaluación cuenta la primera respuesta de cada pregunta en cada intento, con un objetivo del 80 % de las opciones de la etapa, y «Repetir las falladas» permite practicar sin cambiar esa nota.

Los 60 diagramas permiten arrastrar las opciones sobre sus casillas, o pulsar una opción y después el destino. Arrastrar una respuesta ya colocada la mueve; pulsar una casilla ocupada la vacía. La alternativa «Responder con desplegables» permite usar los controles habituales. Ambos modos comparten respuestas, bloqueo de letras y corrección. Las zonas se definen en `ABD/guia-t1-4/diagramas.js` (`window.GUIA_DIAGRAMAS`) como `[x, y, ancho, alto]` en píxeles de la imagen original, en orden de casilla. Si sustituyes una figura, revisa sus zonas. Ejecuta `node --test tests/guia.test.cjs` para comprobar que cada diagrama tiene todas sus zonas y que no se solapan.

La prueba `tests/diagramas.browser.cjs` comprueba los 60 diagramas, arrastre con ratón y táctil, teclado, cancelación, corrección, recarga, errores de imagen y contraste en ambos temas. Con el servidor local en el puerto 8000, puedes ejecutarla con Playwright instalado fuera del proyecto (solo se necesita para las pruebas):

```bash
npm install --prefix /tmp/tests-universidad-browser playwright
/tmp/tests-universidad-browser/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/tests-universidad-browser/node_modules node tests/diagramas.browser.cjs
```

Para otro servidor, define `TEST_URL`, por ejemplo `TEST_URL=http://127.0.0.1:8765`.

La guía de Calidad está en `CalidadSoftware/cs-guia-t1-4.html`, con los datos y figuras en `CalidadSoftware/guia-t1-4/`. Reutiliza el mismo motor y guarda su progreso con el identificador independiente `cs-guia-t1-4`. Contiene las 300 preguntas del banco del Dr. Richard Avilés López (v1.0, 23/10/2026): 90 test, 45 cálculos, 60 huecos, 45 relaciones, 30 diagramas y 30 ejercicios de ordenar; además de las 39 fórmulas, ejemplos guiados y explicaciones del solucionario. El alcance es Tema 1 (1.1 y 1.6–1.9), Tema 2 completo, Tema 3 completo y Tema 4 (4.1–4.4).

Comprobación de los datos y los diagramas de Calidad:

```bash
node --test tests/calidad-guia.test.cjs
```

Con Playwright instalado como se indica arriba y el servidor local activo, la prueba de navegador resuelve las 300 preguntas y comprueba imágenes, persistencia, formulario, repaso, segundo intento, interacción de diagramas y vista móvil:

```bash
TEST_URL=http://127.0.0.1:8000 NODE_PATH=/tmp/tests-universidad-browser/node_modules node tests/calidad-guia.browser.cjs
```

## Publicación

El sitio puede servirse desde cualquier alojamiento de archivos estáticos, incluido GitHub Pages. Publica la raíz del repositorio conservando las carpetas y sus rutas relativas. No requiere instalar paquetes, compilar ni configurar variables de entorno.
