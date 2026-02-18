# Informe Técnico: Estructura y Conexiones de la Base de Datos

## 1. Introducción

Este documento detalla la arquitectura de datos de la aplicación ICSA. La base de datos está organizada en **colecciones** (tablas) dentro de Firebase Firestore, diseñadas para garantizar la trazabilidad, la seguridad basada en roles y la eficiencia operativa.

---

## 2. Colecciones Principales

### A. `personnel` (Personal y Usuarios)
*   **Identificador (ID)**: El ID del documento es el `uid` único generado por Firebase Auth.
*   **Propósito**: Es el núcleo de seguridad y gestión de recursos humanos.
*   **Campos Clave**:
    *   `nombre_t`, `rut_t`, `email_t`: Datos de identificación.
    *   `rol_t`: Define el acceso (**admin**, **supervisor**, **tecnico**).
    *   `signatureUrl`: Firma digital guardada del empleado para autocompletado.
*   **Uso en la App**: 
    *   Determina qué ve el usuario al iniciar sesión.
    *   Puebla la lista de "Equipo de Trabajo" en las OTs.

### B. `clients` (Cartera de Clientes)
*   **Propósito**: Directorio centralizado de empresas clientes.
*   **Campos Clave**: `razonSocial`, `nombreCliente`, `rutCliente`, `emailClientes`, `telefonoCliente`.
*   **Uso en la App**: Permite al supervisor buscar un cliente y autocompletar toda su ficha técnica en una nueva OT con un solo clic.

### C. `ordenes` (Órdenes de Trabajo Activas)
*   **Propósito**: Gestión de trabajos en curso o pendientes de firma.
*   **Campos Clave**:
    *   `folio`: Número correlativo de la OT.
    *   `supervisorId` / `createdBy`: Vinculación directa con el creador (`personnel`).
    *   `status`: Estados como "Pending", "Active" o "Pending Signature".
    *   `team`: Array de nombres del personal asignado.
*   **Uso en la App**: Se muestra en el Dashboard principal. Es donde ocurre toda la edición técnica y captura de evidencia.

### D. `historial` (Archivo Histórico)
*   **Propósito**: Almacenamiento inmutable de trabajos finalizados.
*   **Conexión**: Cuando una OT en `ordenes` recibe todas las firmas (técnico y receptor), el sistema la **mueve** físicamente a esta colección y la elimina de la tabla de activos.

---

## 3. Conexiones y Flujo de Datos

1.  **Autenticación**: El usuario entra con su correo. El sistema busca su `uid` en `personnel` para obtener su `rol_t`.
2.  **Creación de OT**:
    *   El sistema toma el `uid` del supervisor y lo guarda en `supervisorId`.
    *   Se extraen los datos de `clients` para llenar la información del receptor.
    *   Se consultan otros documentos de `personnel` para formar el `team`.
3.  **Firma Remota**:
    *   Se genera un `signatureToken` en la OT.
    *   Las **Reglas de Seguridad** permiten que un cliente externo lea *solo* esa OT si el token en la URL coincide con el de la base de datos.
4.  **Finalización**: Al detectar ambas firmas, el documento se transfiere de `ordenes` a `historial`, manteniendo la integridad de los datos para auditorías futuras.

---

## 4. Resumen de Relaciones

| Colección A | Relación | Colección B | Propósito |
| :--- | :---: | :--- | :--- |
| `Auth User` | 1:1 | `personnel` | Vincula credenciales con perfil y rol. |
| `personnel` | 1:N | `ordenes` | Un supervisor gestiona múltiples órdenes. |
| `clients` | 1:N | `ordenes` | Un cliente puede tener múltiples trabajos. |
| `ordenes` | Migración | `historial` | Traspaso de datos al completar el ciclo de vida. |
