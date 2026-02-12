# Informe Técnico: Estructura de la Base de Datos

## 1. Introducción

Este documento describe, de manera sencilla, cómo está organizada la información de la aplicación en la base de datos. Pensemos en la base de datos como un archivador digital con diferentes carpetas (que llamaremos "tablas"). Cada tabla guarda un tipo de información específica y se comunican entre sí para que la aplicación funcione correctamente.

## 2. Las "Tablas" Principales y su Función

Nuestra base de datos se compone de 5 tablas principales:

### Tabla 1: `users` (Usuarios del Sistema)

*   **¿Qué guarda?**: La información de acceso de cada persona que puede usar el software (ej: `supervisor@icsa.com`, `admin@icsa.com`). Guarda su correo, su rol y si su cuenta está activa. Los usuarios con rol "Técnico" no pueden acceder, por lo que no suelen estar aquí.
*   **¿Para qué se usa?**: Es la lista de invitados. Cuando alguien intenta entrar, el sistema revisa esta tabla (y la de `personnel`) para ver si tiene permiso. Es el primer filtro de seguridad.

### Tabla 2: `clients` (Clientes)

*   **¿Qué guarda?**: Es la agenda de contactos de los clientes de ICSA. Contiene toda la información de cada empresa: Razón Social, RUT, Nombre de Contacto, Dirección, Teléfono, etc.
*   **¿Para qué se usa?**: Para no tener que escribir los datos del cliente cada vez. Cuando un supervisor crea una nueva Orden de Trabajo, puede buscar al cliente en esta tabla y el sistema rellena los datos automáticamente.

### Tabla 3: `personnel` (Personal de ICSA)

*   **¿Qué guarda?**: La ficha de cada empleado de ICSA. Guarda su nombre, RUT, correo, y su rol (**Administrador, Supervisor o Técnico**). También almacena **su firma digitalizada** si decidieron guardarla.
*   **¿Para qué se usa?**: Es la base de datos central de empleados. Se usa para:
    *   Verificar si un usuario que intenta iniciar sesión tiene un rol permitido (Supervisor o Admin).
    *   Poblar la lista de selección de equipo cuando un supervisor crea una OT.
    *   Autocompletar el nombre y RUT del supervisor en una OT.
    *   Cargar la firma guardada del personal.

### Tabla 4: `ordenes` (Órdenes de Trabajo Activas)

*   **¿Qué guarda?**: Todas las Órdenes de Trabajo que están **pendientes** o en curso. Ahora también guarda el **equipo de trabajo** asignado a esa OT (una lista con los nombres del personal).
*   **¿Para qué se usa?**: Es el corazón operativo. Cuando se crea una nueva OT, se guarda aquí. La pantalla de "Inicio" del Dashboard muestra la información que está en esta tabla.

### Tabla 5: `historial` (Archivo de Órdenes Completadas)

*   **¿Qué guarda?**: Es el archivo digital de la empresa. Contiene una copia de todas las Órdenes de Trabajo que ya fueron **finalizadas**. También incluye la información del equipo que fue asignado.
*   **¿Para qué se usa?**: Para la trazabilidad y consulta. Cuando una OT se completa, el sistema la "mueve" desde la tabla `ordenes` a esta tabla. La sección "Historial" y la página de visualización de una OT completada consultan esta tabla.

---

## 3. ¿Cómo Interactúan entre Sí? (El Flujo de Trabajo)

1.  Un **supervisor** (`personnel`) inicia sesión. El sistema valida su correo contra `users` y luego verifica que su rol en `personnel` sea "Supervisor".
2.  El supervisor crea una nueva **Orden de Trabajo**.
3.  Busca un **cliente** en la tabla `clients` para autocompletar sus datos.
4.  En la misma OT, selecciona a varios miembros del personal (`personnel`) para formar su **equipo de trabajo**. La lista de nombres del equipo se guarda en la OT.
5.  Los datos del propio supervisor (nombre, RUT y firma) se sacan de `personnel` y se autocompletan.
6.  Esta nueva OT se guarda en la tabla `ordenes`.
7.  El personal en terreno y el cliente finalizan el trabajo y firman la OT.
8.  Al presionar "Finalizar Orden", el sistema comprueba que todo esté completo y **mueve la OT de la tabla `ordenes` a la tabla `historial`**.
9.  A partir de ese momento, la OT ya no aparece en "Pendientes", sino en la sección "Historial" para futuras consultas, donde se podrá ver también qué equipo fue asignado.

Esta estructura asegura que la información esté organizada y que el flujo de trabajo sea eficiente, separando claramente lo que está en proceso de lo que ya ha sido archivado.
