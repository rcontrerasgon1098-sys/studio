
# Informe Técnico: Arquitectura de Datos y Modelo Entidad-Relación (MER)

Este documento describe la estructura lógica de la base de datos de ICSA para su implementación en diagramas de modelado de datos.

---

## 1. Modelo Conceptual (MER)

La base de datos utiliza una topología de "Estrella" donde las Órdenes de Trabajo consumen información de las entidades maestras (Personal y Clientes).

### A. Entidades Maestras (Sujetos)

#### 1. Personal (`personnel`)
*   **ID del Documento**: UID (Proporcionado por Firebase Auth).
*   **Propósito**: Gestión de identidad, roles y firmas autorizadas.
*   **Atributos**:
    *   `nombre_t`: Nombre completo del colaborador.
    *   `rut_t`: Identificador fiscal.
    *   `rol_t`: **admin** (acceso total), **supervisor** (gestión propia), **tecnico** (solo firma).
    *   `signatureUrl`: Firma digitalizada para auto-completado.

#### 2. Clientes (`clients`)
*   **ID del Documento**: ID autogenerado.
*   **Propósito**: Directorio de empresas y sucursales.
*   **Atributos**:
    *   `nombreCliente`: Nombre comercial.
    *   `rutCliente`: RUT de la empresa.
    *   `emailClientes`: Contacto principal para envío de reportes.

### B. Entidades de Transacción (Objetos)

#### 3. Órdenes de Trabajo (`ordenes` / `historial`)
*   **ID del Documento**: ID autogenerado.
*   **Propósito**: Registro de actividades técnicas en terreno.
*   **Campos de Relación (FK)**:
    *   `createdBy`: (String) UID del Supervisor que inició la orden. **Es el eje de la seguridad.**
    *   `clientId`: (String) ID del cliente vinculado.
*   **Atributos Clave**:
    *   `folio`: Número correlativo de gestión.
    *   `status`: Ciclo de vida (Pending, Active, Pending Signature, Completed).
    *   `description`: Resumen técnico del trabajo.
    *   `techSignatureUrl` / `clientSignatureUrl`: Pruebas de conformidad.

---

## 2. Flujo de Conexiones en la App

### Inicio de Sesión y Perfil
1.  El usuario se autentica.
2.  La app consulta `/personnel/{UID}`.
3.  Si el `rol_t` es `supervisor`, el sistema inyecta este UID en todas las consultas de la aplicación.

### Ciclo de Vida de una OT
1.  **Creación**: El Supervisor crea la OT. La app captura su UID y lo guarda en el campo `createdBy`.
2.  **Filtrado**: En el Dashboard, la app ejecuta:
    `firestore.collection('ordenes').where('createdBy', '==', currentUser.uid)`
3.  **Finalización**: Al firmar, el documento se copia a la colección `historial` manteniendo el mismo `createdBy` para asegurar que el supervisor no pierda la visibilidad de su histórico.

---

## 3. Reglas de Integridad y Seguridad

*   **Visibilidad Vertical**: Los administradores ignoran el filtro `createdBy` para ver la carga de trabajo global de todos los supervisores.
*   **Visibilidad Horizontal**: Un supervisor tiene prohibido leer o editar documentos donde `createdBy` no coincida con su UID de sesión (validado por Firebase Security Rules).
*   **Persistencia**: El campo `createdBy` es inmutable. Una vez que se crea una OT, su "dueño" no puede cambiar, garantizando la trazabilidad.
