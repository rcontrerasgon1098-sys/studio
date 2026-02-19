
# Informe Técnico: Arquitectura de Datos y MER (ICSA)

Este documento define la arquitectura de datos para la gestión de Órdenes de Trabajo de ICSA, estructurada para ser representada en diagramas de Modelado Entidad-Relación (MER).

---

## 1. Modelo Entidad-Relación (Lógico)

Para un diagrama MER, la base de datos se comporta como un sistema relacional con tres ejes maestros y una entidad de transacción.

### A. Entidades Maestras
1. **Personal (`personnel`)**
   - **PK**: `id` (UID de Auth)
   - **Atributos**: `nombre_t`, `rut_t`, `rol_t` (admin, supervisor, tecnico), `email_t`, `signatureUrl`.
   - **Función**: Representa la identidad de los colaboradores.

2. **Clientes (`clients`)**
   - **PK**: `id`
   - **Atributos**: `nombreCliente`, `rutCliente`, `razonSocial`, `direccionCliente`, `emailClientes`.
   - **Función**: Registro maestro de empresas atendidas.

### B. Entidad de Transacción
3. **Órdenes de Trabajo (`ordenes` / `historial`)**
   - **PK**: `id`
   - **FK**: `clientId` (Referencia a la PK de Clientes)
   - **FK**: `createdBy` (Referencia a la PK de Personal - Supervisor)
   - **Atributos**: `folio`, `status`, `startDate`, `description`, `techName`, `techRut`, `techSignatureUrl`, `clientSignatureUrl`, `teamIds` (Array).

### C. Entidad de Relación (Muchos a Muchos)
4. **Asignaciones de Equipo (`Assignments`)**
   - Lógicamente, existe una tabla intermedia entre **Personal** y **Órdenes**.
   - **FK**: `orderId` (Referencia a Órdenes)
   - **FK**: `personnelId` (Referencia a Personal)
   - **Función**: Permite que múltiples técnicos trabajen en una misma orden.

---

## 2. Implementación en Firestore (NoSQL)

Aunque el modelo lógico está normalizado para el diagrama MER, Firestore utiliza técnicas de optimización:

- **Desnormalización de Propiedad**: El campo `createdBy` se utiliza como clave foránea oficial para filtrar la visibilidad del supervisor.
- **Desnormalización de Equipo**: El campo `teamIds` (Array) actúa como una vista materializada de la tabla intermedia de asignaciones, permitiendo consultas instantáneas mediante `array-contains`.
- **Integridad**: Al completar una orden, el sistema realiza una copia profunda de todos los metadatos desde `ordenes` hacia `historial`, preservando las claves foráneas originales.

---

## 3. Automatización de Correo (Brevo)

La aplicación integra **SMTP de Brevo** para notificar a los clientes:
1. **Firma Remota**: Se envía un enlace único al cliente para que firme desde su dispositivo.
2. **Entrega de OT**: Al finalizar, se envía un resumen con el enlace al reporte PDF generado.
