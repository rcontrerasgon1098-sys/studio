
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
   - **FK**: `createdBy` (Referencia a la PK de Personal - Dueño de la OT)
   - **Atributos**: `folio`, `status`, `startDate`, `description`, `techName`, `techRut`, `techSignatureUrl`, `clientSignatureUrl`, `teamIds` (Array para membresía rápida).

### C. Entidad de Relación (Muchos a Muchos)
4. **Asignaciones de Equipo (`Assignments`)**
   - Lógicamente, representa la tabla intermedia entre **Personal** y **Órdenes**.
   - **FK**: `orderId` (Referencia a Órdenes)
   - **FK**: `personnelId` (Referencia a Personal)
   - **Función**: Permite que múltiples técnicos trabajen en una misma orden.

---

## 2. Automatización de Notificaciones (Brevo SMTP)

La aplicación integra el servicio **Brevo** para la comunicación con los clientes:
1. **Firma Remota**: Se envía un enlace único al cliente para que firme desde su dispositivo móvil. El sistema valida el token de seguridad antes de permitir la firma.
2. **Entrega de OT**: Una vez completada la orden, se envía automáticamente un correo electrónico con el resumen de los trabajos y un enlace directo al reporte PDF.
3. **Configuración**: El sistema utiliza el puerto 587 (STARTTLS) con autenticación mediante claves SMTP específicas de Brevo.

---

## 3. Implementación en Firestore (NoSQL)

Aunque el modelo lógico es relacional, Firestore optimiza la lectura:
- **Desnormalización**: El campo `createdBy` es la clave oficial para la visibilidad del supervisor.
- **Integridad**: Al finalizar una orden, se realiza una copia profunda de todos los metadatos desde `ordenes` hacia `historial`, preservando la autoría y los IDs originales.
