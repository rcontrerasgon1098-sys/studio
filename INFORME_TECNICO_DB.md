
# Informe Técnico: Estructura y Conexiones de la Base de Datos

## 1. Introducción

Este documento detalla la arquitectura de datos de la aplicación ICSA. La base de datos está organizada en **colecciones** dentro de Firebase Firestore, utilizando el campo `createdBy` como eje central para la visibilidad y propiedad de la información.

---

## 2. Colecciones Principales

### A. `personnel` (Personal y Usuarios)
*   **Identificador (ID)**: El ID del documento es el `uid` único generado por Firebase Auth.
*   **Gestión de Roles**: El rol de cada usuario se define en el campo `rol_t` (**admin**, **supervisor**, **tecnico**).
*   **Campos Clave**: `nombre_t`, `rut_t`, `email_t`, `rol_t`.

### B. `ordenes` (Órdenes de Trabajo Activas)
*   **Propósito**: Gestión de trabajos en curso.
*   **Campo de Propiedad**: `createdBy` (String UID). Contiene el UID del supervisor que creó la OT.
*   **Conexión**: La app filtra estas órdenes usando `.where("createdBy", "==", currentUser.uid)` para usuarios con rol `supervisor`.

### C. `historial` (Archivo Histórico)
*   **Propósito**: Almacenamiento de trabajos finalizados.
*   **Conexión**: Al igual que en `ordenes`, se mantiene el campo `createdBy` para asegurar que el supervisor pueda consultar su propio historial de trabajos.

---

## 3. Lógica de Visibilidad (Supervisor "illojuan")

Cuando un usuario como "illojuan" inicia sesión:
1.  La aplicación detecta su UID único.
2.  Consulta su rol en `/personnel/{UID}`.
3.  Si es `supervisor`, todas las pantallas de listado (Dashboard, Órdenes, Historial) aplican automáticamente el filtro de Firestore sobre el campo `createdBy`.
4.  Esto garantiza que "illojuan" solo vea las órdenes que él mismo guardó, blindando la privacidad entre distintos supervisores.

## 4. Seguridad de Reglas de Firestore

Las reglas de seguridad están configuradas para validar que:
1.  Los **Administradores** tengan lectura total.
2.  Los **Supervisores** solo puedan leer y editar documentos donde `resource.data.createdBy == request.auth.uid`.
3.  El campo `createdBy` sea inyectado obligatoriamente por la aplicación en cada creación de documento.
