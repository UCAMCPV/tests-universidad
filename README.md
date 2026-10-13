# Mis tests de universidad

Web de estudio en español para asignaturas del Grado en Ingeniería Informática. Combina resúmenes, tests de autoevaluación con explicaciones y ejercicios resueltos de Kotlin.

Está hecha con HTML, CSS y JavaScript sin frameworks, dependencias externas, backend ni paso de compilación. Las preguntas se definen dentro de cada página HTML y comparten un único motor de tests.

## Contenido

| Asignatura | Material disponible |
| --- | --- |
| Administración de Bases de Datos | Resúmenes y tests de los temas 1 (fundamentos), 2 (Oracle y ecosistema de datos) y 3 (arquitectura de un SGBD, apartados 3.0–3.2). |
| Aplicaciones para Dispositivos Móviles | Resumen y test del tema 2 (Kotlin), más 16 ejercicios resueltos. |
| Ingeniería del Conocimiento | Resúmenes y tests de los temas 1, 1.1, 2, 2.1 y 2.2, más un examen parcial de 30 preguntas. |
| Calidad de Software | Resúmenes y tests de los temas 1 (concepto de calidad del software) y 2 (técnicas de revisión, secciones 2.0–2.5). |
| Administración de Sistemas | Resúmenes y tests de los temas 1 (sistemas de información) y 2 (virtualización). |

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
│   └── styles.css              # Estilos comunes y diseño adaptable
├── ABD/                        # Administración de Bases de Datos
├── Moviles/                    # Kotlin: resumen, test y ejercicios
├── IngenieriaConocimiento/     # Resúmenes, tests y examen parcial
├── CalidadSoftware/            # Resúmenes y tests de calidad del software
└── Sistemas/                   # Resúmenes, tests y apuntes en Unidad1/*.md
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

## Publicación

El sitio puede servirse desde cualquier alojamiento de archivos estáticos, incluido GitHub Pages. Publica la raíz del repositorio conservando las carpetas y sus rutas relativas. No requiere instalar paquetes, compilar ni configurar variables de entorno.
