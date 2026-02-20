
# Informe Técnico: Arquitectura de Datos Relacional (ICSA)

Este documento detalla la estructura lógica de la base de datos para la gestión de Órdenes de Trabajo de ICSA, normalizada para su representación en diagramas MER.

---

## 1. Modelo Entidad-Relación (Lógico)

Para un diagrama MER, la base de datos se estructura mediante la normalización de la relación entre técnicos y órdenes.

### A. Entidades Maestras
1. **Personal (`personnel`)**
   - **PK**: `id` (TEXT)
   - **Atributos**: `nombre_t`, `rut_t`, `email_t`, `rol_t`, `estado_t`, `signatureUrl`.
   - **Propósito**: Define quién tiene acceso al sistema y sus capacidades.

2. **Clientes (`clients`)**
   - **PK**: `id` (TEXT)
   - **Atributos**: `nombreCliente`, `rutCliente`, `razonSocial`, `direccionCliente`, `emailClientes`.
   - **Propósito**: Registro centralizado de empresas contratistas.

### B. Entidad Transaccional
3. **Órdenes de Trabajo (`work_orders`)**
   - **PK**: `id` (TEXT)
   - **FK**: `clientId` (Referencia a Clientes)
   - **FK**: `createdBy` (Referencia a Personal/Supervisor)
   - **Atributos**: `folio`, `status`, `description`, `techName`, `techSignatureUrl`, `clientSignatureUrl`, `sketchImageUrl`.
   - **Propósito**: Documentar la intervención técnica y capturar las firmas de conformidad.

### C. Entidad de Relación (Muchos a Muchos)
4. **Asignaciones de Equipo (`work_order_team`)**
   - **PK Compuesta**: (`orderId`, `personnelId`)
   - **FK**: `orderId` -> `work_orders.id`
   - **FK**: `personnelId` -> `personnel.id`
   - **Propósito**: Permite que un equipo de múltiples técnicos trabaje en una misma OT, manteniendo la integridad referencial.

---

## 2. Implementación de Seguridad y Flujos

1. **Integridad Referencial**: Al eliminar un registro de `personnel`, las reglas de negocio prefieren el **"Soft Delete"** (Estado Inactivo) para preservar el historial de `work_orders`.
2. **Historial de Propiedad**: El campo `createdBy` es inmutable una vez finalizada la OT, asegurando que el supervisor original siempre sea el dueño del registro.
3. **Automatización Brevo**: El sistema utiliza el campo `clientReceiverEmail` de la tabla `work_orders` para disparar la entrega del reporte PDF final.

---

## 3. Esquema SQL (SQLite)
Para ver el código SQL completo de creación de tablas, consulte el archivo `docs/sqlite_schema.sql`.
