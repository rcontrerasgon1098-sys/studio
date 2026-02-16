# Informe Técnico: Estructura de la Base de Datos

## 1. Introducción

Este documento describe, de manera sencilla, cómo está organizada la información de la aplicación en la base de datos. Pensemos en la base de datos como un archivador digital con diferentes carpetas (que llamaremos "colecciones" o "tablas"). Cada tabla guarda un tipo de información específica y se comunican entre sí para que la aplicación funcione correctamente.

## 2. Las "Tablas" Principales y su Función

Nuestra base de datos se compone de 4 tablas principales:

### Tabla 1: `personnel` (Personal de ICSA)

*   **¿Qué guarda?**: Es la tabla central de usuarios. Contiene la ficha de cada empleado de ICSA, guardando su nombre, RUT, correo y, lo más importante, su rol (**Administrador, Supervisor o Técnico**). También puede almacenar su firma digitalizada.
*   **¿Para qué se usa?**: Es la única fuente de verdad para la autenticación y los permisos. Se usa para:
    *   Verificar si un usuario que intenta iniciar sesión tiene un rol permitido (Supervisor o Admin).
    *   Poblar la lista de selección de equipo cuando un supervisor crea una OT.
    *   Autocompletar el nombre y RUT del supervisor en una OT.
    *   Cargar la firma guardada del personal.

### Tabla 2: `clients` (Clientes)

*   **¿Qué guarda?**: Es la agenda de contactos de los clientes de ICSA. Contiene toda la información de cada empresa: Razón Social, RUT, Nombre de Contacto, Dirección, Teléfono, etc.
*   **¿Para qué se usa?**: Para no tener que escribir los datos del cliente cada vez. Cuando un supervisor crea una nueva Orden de Trabajo, puede buscar al cliente en esta tabla y el sistema rellena los datos automáticamente.

### Tabla 3: `ordenes` (Órdenes de Trabajo Activas)

*   **¿Qué guarda?**: Todas las Órdenes de Trabajo que están **pendientes** o en curso. Ahora también guarda el **equipo de trabajo** asignado a esa OT (una lista con los nombres del personal).
*   **¿Para qué se usa?**: Es el corazón operativo. Cuando se crea una nueva OT, se guarda aquí. La pantalla de "Inicio" del Dashboard muestra la información que está en esta tabla.

### Tabla 4: `historial` (Archivo de Órdenes Completadas)

*   **¿Qué guarda?**: Es el archivo digital de la empresa. Contiene una copia de todas las Órdenes de Trabajo que ya fueron **finalizadas**. También incluye la información del equipo que fue asignado.
*   **¿Para qué se usa?**: Para la trazabilidad y consulta. Cuando una OT se completa, el sistema la "mueve" desde la tabla `ordenes` a esta tabla. La sección "Historial" y la página de visualización de una OT completada consultan esta tabla.

---

## 3. ¿Cómo Interactúan entre Sí? (El Flujo de Trabajo)

1.  Un **supervisor** (`personnel`) inicia sesión. El sistema valida sus credenciales y luego verifica directamente en la tabla `personnel` que su rol sea "Supervisor" o "Administrador".
2.  El supervisor crea una nueva **Orden de Trabajo**.
3.  Busca un **cliente** en la tabla `clients` para autocompletar sus datos.
4.  En la misma OT, selecciona a varios miembros del personal (`personnel`) para formar su **equipo de trabajo**. La lista de nombres del equipo se guarda en la OT.
5.  Los datos del propio supervisor (nombre, RUT y firma) se sacan de `personnel` y se autocompletan.
6.  Esta nueva OT se guarda en la tabla `ordenes`.
7.  El personal en terreno y el cliente finalizan el trabajo y firman la OT.
8.  Al presionar "Finalizar Orden", el sistema comprueba que todo esté completo y **mueve la OT de la tabla `ordenes` a la tabla `historial`**.
9.  A partir de ese momento, la OT ya no aparece en "Pendientes", sino en la sección "Historial" para futuras consultas, donde se podrá ver también qué equipo fue asignado.

Esta estructura asegura que la información esté organizada y que el flujo de trabajo sea eficiente, centralizando los perfiles y permisos en una única tabla (`personnel`).
