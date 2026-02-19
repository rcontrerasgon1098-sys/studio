
# Informe Técnico: Estructura y Conexiones de la Base de Datos

## 1. Introducción

Este documento detalla la arquitectura de datos de la aplicación ICSA. La base de datos está organizada en **colecciones** dentro de Firebase Firestore, utilizando un modelo de "Roles Integrados" para optimizar el rendimiento y la seguridad.

---

## 2. Colecciones Principales

### A. `personnel` (Personal y Usuarios)
*   **Identificador (ID)**: El ID del documento es el `uid` único generado por Firebase Auth.
*   **Gestión de Roles**: No existe una tabla externa de "Roles". El rol de cada usuario se define en el campo `rol_t`.
*   **Campos Clave**:
    *   `nombre_t`, `rut_t`, `email_t`: Datos de identificación.
    *   `rol_t`: Define el acceso (**admin**, **supervisor**, **tecnico**).
    *   `signatureUrl`: Firma digital guardada para autocompletado en OTs.
*   **Uso en la App**: Es el "pasaporte" del usuario. Determina qué vistas y qué datos (propios vs todos) puede ver el supervisor o administrador.

### B. `clients` (Cartera de Clientes)
*   **Propósito**: Directorio centralizado de empresas clientes.
*   **Campos Clave**: `razonSocial`, `nombreCliente`, `rutCliente`, `emailClientes`, `telefonoCliente`.
*   **Uso en la App**: Los supervisores seleccionan un cliente y la app puebla automáticamente la OT con sus datos fiscales y de contacto.

### C. `ordenes` (Órdenes de Trabajo Activas)
*   **Propósito**: Gestión de trabajos en curso o en proceso de firma.
*   **Campos Clave**:
    *   `folio`: Número correlativo.
    *   `createdBy`: **Campo Crítico**. Vincula la OT con el usuario que la creó (UID) para que este pueda verla en su dashboard.
    *   `status`: "Pending", "Active" o "Pending Signature".
    *   `team`: Array con los nombres del personal asignado.
*   **Uso en la App**: Se filtran por `createdBy` para que cada supervisor solo gestione su propia carga de trabajo.

### D. `historial` (Archivo Histórico)
*   **Propósito**: Almacenamiento de trabajos finalizados ("Completed").
*   **Ciclo de Vida**: Al recibir la firma del receptor, la OT se mueve de `ordenes` a `historial` y se elimina de la lista de activos.

---

## 3. Conexiones y Seguridad

1.  **Verificación de Rol**: Al iniciar sesión, la app consulta `/personnel/{uid}`. Si el `rol_t` es "supervisor", la app configura todas las consultas (Queries) para incluir un filtro `.where("createdBy", "==", uid)`.
2.  **Integridad de Datos**: Al crear una OT, el sistema inyecta automáticamente el `uid` del usuario actual en el campo `createdBy`. Sin este campo, el creador perdería visibilidad de la OT creada.
3.  **Reglas de Firestore**: Las reglas están configuradas para permitir que un Supervisor lea y escriba solo si su `uid` coincide con el `createdBy` del documento, o si es un Administrador (acceso total).

---

## 4. Resumen de Relaciones

| Colección A | Relación | Colección B | Propósito |
| :--- | :---: | :--- | :--- |
| `Firebase Auth` | 1:1 | `personnel` | Vincula credenciales con el perfil que contiene el `rol_t`. |
| `personnel` | 1:N | `ordenes` | Un usuario (vía `createdBy`) es dueño de sus propias órdenes. |
| `clients` | 1:N | `ordenes` | Un cliente recibe múltiples servicios técnicos. |
| `ordenes` | Migración | `historial` | Traspaso al historial tras completar firmas y validaciones. |
