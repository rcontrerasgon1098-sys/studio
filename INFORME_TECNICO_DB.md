
# Informe Técnico: Arquitectura de Datos y MER (ICSA)

Este documento define la arquitectura de datos para la gestión de Órdenes de Trabajo de ICSA, estructurada para ser representada en diagramas de Modelado Entidad-Relación (MER).

---

## 1. Modelo Entidad-Relación (Lógico)

Para un diagrama MER, la base de datos se comporta como un sistema relacional con tres ejes maestros y una entidad de transacción.

### A. Entidades Maestras
1. **Personal (`personnel`)**
   - **PK**: `id` (UID de Auth)
   - Contiene la identidad, rol y firma del colaborador.
2. **Clientes (`clients`)**
   - **PK**: `id`
   - Contiene los datos fiscales y de contacto de las empresas atendidas.

### B. Entidad de Transacción
3. **Órdenes de Trabajo (`ordenes` / `historial`)**
   - **PK**: `id`
   - **FK**: `clientId` (Referencia a Clientes)
   - **FK**: `createdBy` (Referencia a Personal/Supervisor)
   - **FK**: `technicianId` (Referencia a Personal/Técnico Principal)

### C. Entidad de Relación (Muchos a Muchos)
4. **Equipo de Trabajo (`WorkOrderTeam`)**
   - Esta es una relación **N:M** normalizada.
   - En el diagrama MER, se representa como una tabla intermedia entre **Personal** y **Órdenes**.
   - **FK**: `orderId`
   - **FK**: `personnelId`

---

## 2. Implementación en Firestore (NoSQL)

Aunque el modelo lógico está normalizado, Firestore utiliza **Desnormalización** para optimizar el rendimiento de la App Móvil:

- **Denormalización de Equipo**: El campo `teamIds` (Array) dentro de cada Orden actúa como una "Vista Materializada" de la tabla intermedia. Esto permite que el Dashboard consulte todas las órdenes de un usuario con un solo índice (`array-contains`), sin necesidad de hacer Joins costosos en tiempo real.
- **Integridad**: Cuando se añade un miembro al equipo en la UI, la app actualiza tanto el nombre (`team`) como el ID (`teamIds`), asegurando que la búsqueda y la visualización sean inmediatas.

---

## 3. Flujo de Visibilidad y Propiedad

1. **Creación**: Al crear una OT, se inyecta el UID del supervisor en `createdBy`. 
2. **Dashboard**: El sistema ejecuta `where("createdBy", "==", currentUser.uid)` para filtrar el flujo de trabajo del supervisor.
3. **Cierre**: Al mover a `historial`, se preservan todas las claves foráneas (`createdBy`, `clientId`) para mantener la trazabilidad histórica.
