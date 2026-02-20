
-- Esquema Relacional para ICSA (Compatible con SQLite)
-- Generado para documentación de Diagrama MER

-- 1. Tabla de Personal (Usuarios)
CREATE TABLE personnel (
    id TEXT PRIMARY KEY, -- UID de Firebase Auth
    nombre_t TEXT NOT NULL,
    rut_t TEXT NOT NULL,
    email_t TEXT UNIQUE NOT NULL,
    rol_t TEXT CHECK(rol_t IN ('Administrador', 'Supervisor', 'Técnico')) NOT NULL,
    cel_t TEXT,
    estado_t TEXT DEFAULT 'Activo' CHECK(estado_t IN ('Activo', 'Inactivo')),
    signatureUrl TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    nombreCliente TEXT NOT NULL,
    rutCliente TEXT NOT NULL,
    razonSocial TEXT,
    direccionCliente TEXT,
    comunaCliente TEXT,
    telefonoCliente TEXT,
    emailClientes TEXT,
    estadoCliente TEXT DEFAULT 'Activo'
);

-- 3. Tabla de Órdenes de Trabajo (Unificada)
CREATE TABLE work_orders (
    id TEXT PRIMARY KEY,
    folio INTEGER NOT NULL UNIQUE,
    clientId TEXT NOT NULL,
    createdBy TEXT NOT NULL, -- Supervisor dueño
    supervisorId TEXT NOT NULL, -- UID redundante para reglas
    status TEXT CHECK(status IN ('Pending', 'Active', 'Pending Signature', 'Completed')),
    
    -- Detalles Técnicos
    address TEXT,
    building TEXT,
    floor TEXT,
    signalType TEXT,
    signalCount INTEGER DEFAULT 1,
    isCert INTEGER DEFAULT 0, -- Booleano (0/1)
    certifiedPointsCount INTEGER DEFAULT 0,
    isPlan INTEGER DEFAULT 0,
    isLabeled INTEGER DEFAULT 0,
    labelDetails TEXT,
    isCanalized INTEGER DEFAULT 0,
    description TEXT,
    
    -- Datos de Terreno (Técnico)
    techName TEXT,
    techRut TEXT,
    techSignatureUrl TEXT,
    
    -- Datos de Recepción (Cliente)
    clientReceiverName TEXT,
    clientReceiverRut TEXT,
    clientReceiverEmail TEXT,
    clientSignatureUrl TEXT,
    sketchImageUrl TEXT,
    
    -- Tiempos
    startDate TEXT,
    updatedAt TEXT,
    
    FOREIGN KEY (clientId) REFERENCES clients(id),
    FOREIGN KEY (createdBy) REFERENCES personnel(id)
);

-- 4. Tabla de Asignaciones de Equipo (Relación Muchos-a-Muchos)
-- Esta tabla normaliza el campo 'team'
CREATE TABLE work_order_team (
    orderId TEXT NOT NULL,
    personnelId TEXT NOT NULL,
    PRIMARY KEY (orderId, personnelId),
    FOREIGN KEY (orderId) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
);
