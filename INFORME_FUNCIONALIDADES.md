
# Informe Funcional de la Aplicación de Gestión ICSA

## 1. Introducción

Este documento describe las funcionalidades de la aplicación web desarrollada para **ICSA ingeniería comunicaciones S.A.**, diseñada para digitalizar y optimizar el proceso de creación, gestión y seguimiento de Órdenes de Trabajo (OT).

El objetivo principal de la aplicación es reemplazar los formularios en papel por un sistema digital, centralizado y eficiente que mejora la trazabilidad, agiliza los procesos administrativos y proyecta una imagen más moderna y profesional ante los clientes.

---

## 2. Módulos y Funcionalidades Principales

La aplicación se estructura en los siguientes módulos clave:

### Módulo 1: Acceso y Seguridad

Es la puerta de entrada al sistema, garantizando que solo el personal autorizado pueda acceder a la información.

- **Inicio de Sesión Seguro**: El acceso está restringido mediante un sistema de correo electrónico y contraseña. Solo los usuarios registrados con un rol autorizado pueden ingresar.
- **Roles de Usuario**: El sistema diferencia entre varios roles, cada uno con un propósito específico:
    - **Administrador**: Tiene control total sobre el sistema, incluyendo la gestión de personal y clientes.
    - **Supervisor**: Es el antiguo rol "Técnico". Puede iniciar sesión, crear y gestionar Órdenes de Trabajo, y asignar equipos de campo.
    - **Técnico**: Es un rol de operario de campo. Los técnicos son asignados a las OTs por un supervisor, pero **no tienen acceso** para iniciar sesión en la aplicación.

### Módulo 2: Panel de Control (Dashboard)

Es el centro de operaciones donde el usuario tiene una visión global y acceso a todas las secciones importantes de la aplicación.

- **Inicio**: Es la pantalla principal. Ofrece un vistazo rápido y directo a lo más importante:
    - **Indicador de Órdenes Activas**: Un recuadro destacado que muestra cuántos trabajos están actualmente en curso.
    - **Listado de Pendientes**: Una tabla con acceso directo a todas las órdenes que aún no se han completado.
- **Estadísticas**: Una sección dedicada a la inteligencia de negocio. Permite visualizar el rendimiento del equipo a través de gráficos:
    - **Gráfico Circular**: Muestra la proporción de órdenes pendientes frente a las completadas.
    - **Gráfico de Barras**: Registra el volumen de órdenes finalizadas en la última semana, permitiendo medir la productividad diaria.
- **Órdenes Activas**: Un apartado que centraliza exclusivamente los trabajos en curso. Incluye un buscador para filtrar por folio o cliente.
- **Historial**: El "archivo digital" de la empresa. Aquí se almacenan todas las órdenes de trabajo que han sido completadas. Incluye un potente filtro para buscar por folio, cliente o **fecha específica**, facilitando auditorías y consultas pasadas.
- **Clientes y Personal**: Son las "agendas de contacto" del sistema, permitiendo administrar la información vital de la empresa.

### Módulo 3: Gestión de Órdenes de Trabajo (OT)

Este es el corazón de la aplicación, donde se digitaliza todo el flujo de trabajo de campo.

- **Creación de OT Digital**:
    - **Folio Automático**: Al crear una nueva OT, el sistema le asigna un número de folio único e irrepetible.
    - **Búsqueda y Autocompletado de Clientes**: El supervisor puede buscar un cliente ya registrado. Al seleccionarlo, el sistema rellena automáticamente los datos del cliente (Nombre, Contacto, Dirección).
- **Asignación de Equipo de Trabajo**:
    - Al crear o editar una OT, el **Supervisor** debe seleccionar el equipo de trabajo.
    - Puede elegir a uno o varios miembros del personal (otros Supervisores o Técnicos) de una lista, facilitando la asignación de recursos.
- **Formulario Completo (Modelo ICSA)**: El formulario digital es un reflejo profesional del documento físico, incluyendo:
    - Detalles del servicio, checklist de instalación (Certificación, Planos, etc.), y un campo para la descripción de los trabajos realizados.
    - **Captura de Fotos**: Se puede tomar una foto directamente con el celular o subir una imagen como evidencia o bosquejo del trabajo.
- **Firmas Digitales**: La funcionalidad más importante para la validación.
    - El responsable en terreno (supervisor o técnico) y el cliente pueden firmar directamente sobre la pantalla del dispositivo.
    - El sistema captura y almacena estas firmas como una imagen segura dentro del reporte de la OT.
- **Firma Inteligente para Supervisores/Técnicos**:
    - La primera vez que un miembro del personal firma, el sistema le pregunta si desea **guardar esa firma para el futuro**.
    - Si acepta, en las próximas OTs, su firma se cargará automáticamente.
- **Lógica de Estados (Pendiente vs. Completada)**:
    - Una OT se considera "Completada" solo cuando el técnico ha firmado, el cliente ha firmado y se ha ingresado el RUT de quien recibe.
    - Al completarse, la OT se **mueve automáticamente** de la sección "Órdenes Activas" al "Historial".
- **Generación de Reporte en PDF**:
    - Con un solo clic, el sistema genera un documento PDF profesional con toda la información de la OT (logo de ICSA, datos del servicio, firmas, etc.).
    - La información del equipo de trabajo asignado **no se incluye** en este PDF, ya que es para control interno.

### Módulo 4: Administración (Clientes y Personal)

Este módulo permite gestionar la base de datos de la empresa de forma centralizada.

- **Gestión de Clientes**: Permite crear, ver, editar y eliminar fichas de clientes.
- **Gestión de Personal**: Permite registrar a los técnicos, supervisores y administradores de la empresa con sus respectivos roles.
- **Validación de RUT Chileno**: El sistema incorpora un validador automático (algoritmo Módulo 11). Si un RUT ingresado no es válido, el sistema lo notifica.

---

## 3. Conclusión de Beneficios

La implementación de esta aplicación aporta valor directo a **ICSA** en las siguientes áreas:

- **Eficiencia Operativa**: Reduce drásticamente el tiempo de llenado, entrega y archivo de documentos.
- **Mejor Gestión de Recursos**: Facilita la asignación de equipos a tareas específicas.
- **Reducción de Costos**: Elimina el uso de papel, impresiones y almacenamiento físico.
- **Centralización y Trazabilidad**: Toda la información de los trabajos está en un único lugar, accesible en tiempo real.
- **Imagen Profesional**: La entrega de reportes digitales mejora la percepción del cliente.
- **Reducción de Errores**: Gracias a las validaciones automáticas y el autocompletado de datos.
