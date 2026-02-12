# Informe Técnico: Estructura de la Base de Datos

## 1. Introducción

Este documento describe, de manera sencilla, cómo está organizada la información de la aplicación en la base de datos. Pensemos en la base de datos como un archivador digital con diferentes carpetas (que llamaremos "tablas"). Cada tabla guarda un tipo de información específica y se comunican entre sí para que la aplicación funcione correctamente.

## 2. Las "Tablas" Principales y su Función

Nuestra base de datos se compone de 5 tablas principales:

### Tabla 1: `users` (Usuarios del Sistema)

*   **¿Qué guarda?**: La información de acceso de cada persona que puede usar el software (ej: `tecnico@icsa.com`, `admin@icsa.com`). Guarda su correo, su rol (si es técnico o administrador) y si su cuenta está activa.
*   **¿Para qué se usa?**: Es la lista de invitados. Cuando alguien intenta entrar, el sistema revisa esta tabla para ver si tiene permiso. Es el primer filtro de seguridad.

### Tabla 2: `clients` (Clientes)

*   **¿Qué guarda?**: Es la agenda de contactos de los clientes de ICSA. Contiene toda la información de cada empresa: Razón Social, RUT, Nombre de Contacto, Dirección, Teléfono, etc.
*   **¿Para qué se usa?**: Para no tener que escribir los datos del cliente cada vez. Cuando un técnico crea una nueva Orden de Trabajo, puede buscar al cliente en esta tabla y el sistema rellena los datos automáticamente, ahorrando tiempo y evitando errores.

### Tabla 3: `personnel` (Personal de ICSA)

*   **¿Qué guarda?**: La ficha de cada empleado de ICSA, especialmente los técnicos. Guarda su nombre, RUT, correo y, lo más importante, **su firma digitalizada** si decidieron guardarla.
*   **¿Para qué se usa?**: Agiliza la creación de Órdenes de Trabajo. El sistema toma de aquí el nombre y RUT del técnico que está usando la app. Si el técnico guardó su firma, esta tabla se la entrega al formulario para que se ponga sola, sin necesidad de volver a dibujar.

### Tabla 4: `ordenes` (Órdenes de Trabajo Activas)

*   **¿Qué guarda?**: Todas las Órdenes de Trabajo que están **pendientes** o en curso. Es la bandeja de "trabajo por hacer".
*   **¿Para qué se usa?**: Es el corazón operativo. Cuando se crea una nueva OT, se guarda aquí. La pantalla de "Inicio" del Dashboard muestra la información que está en esta tabla. Mientras una OT esté aquí, se puede editar.

### Tabla 5: `historial` (Archivo de Órdenes Completadas)

*   **¿Qué guarda?**: Es el archivo digital de la empresa. Contiene una copia de todas las Órdenes de Trabajo que ya fueron **finalizadas** (firmadas por el técnico y el cliente, y con el RUT de recepción).
*   **¿Para qué se usa?**: Para la trazabilidad y consulta. Cuando una OT se completa, el sistema la "mueve" desde la tabla `ordenes` a esta tabla. Esto mantiene la lista de trabajos activos siempre limpia, mostrando solo lo pendiente. La pestaña "Historial" del Dashboard consulta esta tabla para mostrar los trabajos pasados.

---

## 3. ¿Cómo Interactúan entre Sí? (El Flujo de Trabajo)

Imaginemos un flujo de trabajo típico para entender cómo se conectan estas tablas:

1.  Un **técnico** (`personnel`) inicia sesión. El sistema lo valida contra la tabla `users`.
2.  El técnico crea una nueva **Orden de Trabajo**.
3.  Para la OT, busca un **cliente** en la tabla `clients`. Al seleccionarlo, los datos del cliente se copian a la OT.
4.  Los datos del propio técnico (nombre, RUT y su firma guardada) se sacan de la tabla `personnel` y también se ponen en la OT.
5.  Esta nueva OT, como está incompleta, se guarda en la tabla `ordenes`.
6.  El técnico y el cliente finalizan el trabajo y firman la OT.
7.  Al presionar "Finalizar Orden", el sistema comprueba que todo esté completo y realiza una acción clave: **mueve la OT de la tabla `ordenes` a la tabla `historial`**.
8.  A partir de ese momento, la OT ya no aparece en "Pendientes", sino en la sección "Historial" para futuras consultas o para generar el PDF.

Esta estructura asegura que la información esté organizada, sea segura y que el flujo de trabajo sea eficiente, separando claramente lo que está en proceso de lo que ya ha sido archivado.