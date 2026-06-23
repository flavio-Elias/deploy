
CREATE EXTENSION IF NOT EXISTS vector; --Hay que probar si funciona si quiera esta extension

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL CHECK (name IN ('Administrador','Empleado General','Seguridad','Mantenimiento','Visita','Proveedor','Gerencia'))
);

CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

--Tabla de muchos a muchos, roles (como auxiliar por ejemplo) a las zonas a las que birnda acceso ese rol
CREATE TABLE role_zone_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, zone_id) 
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100), -- Agregar UNIQUE para despues
    passw VARCHAR(255), -- Aqui ira el hash
    role_id INT NOT NULL REFERENCES roles(id), 
    face_embedding vector(128), --diganme en que formto viene el embedding pa cambiar esto
    master BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE access_grants (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
    log_type VARCHAR(10) NOT NULL CHECK (log_type IN ('Entrada', 'Salida')), -- CORREGIDO AQUI
    token VARCHAR(255) UNIQUE NOT NULL, 
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked'))
);

CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    zone_id INT REFERENCES zones(id),
    log_type VARCHAR(10) NOT NULL CHECK (log_type IN ('Entrada', 'Salida')), -- CORREGIDO AQUI
    access_method VARCHAR(20) NOT NULL CHECK (access_method IN ('CARA', 'QR')), 
    granted BOOLEAN NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE face_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    iv VARCHAR(64) NOT NULL,
    embedding vector(128),
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_zone_bans (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, zone_id) 
);


ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

--POBLAMOS CON DATOS DE PRUEBA INICIALES

INSERT INTO roles (id, name) VALUES 
(1, 'Administrador'),
(2, 'Empleado General'),
(3, 'Seguridad'),
(4, 'Mantenimiento'),
(5, 'Visita'),
(6, 'Proveedor'),
(7, 'Gerencia');

INSERT INTO zones (id, name) VALUES 
(1, 'Recepción'),
(2, 'Comedor'),
(3, 'Oficinas Principales'),
(4, 'Sala de Servidores'),
(5, 'Bodega'),
(6, 'Estacionamiento'),
(7, 'Laboratorio'),
(8, 'Sala de Reuniones'),
(9, 'Azotea'),
(10, 'Zona de Descanso');

INSERT INTO users (id, name, role_id, email) VALUES 
(1, 'Iván', 1, 'ivan.admin@ejemplo.com'),
(2, 'María González', 7, 'mgonzalez@ejemplo.com'),
(3, 'Carlos Silva', 3, 'csilva.seguridad@ejemplo.com'),
(4, 'Ana López', 2, 'alopez@ejemplo.com'),
(5, 'Pedro Martínez', 2, 'pmartinez@ejemplo.com'),
(6, 'Laura Torres', 2, 'ltorres@ejemplo.com'),
(7, 'Diego Ramírez', 4, 'dramirez.mant@ejemplo.com'),
(8, 'Sofía Herrera', 5, 'sherrera.visita@ejemplo.com'),
(9, 'Jorge Medina', 6, 'jmedina.prov@ejemplo.com'),
(10, 'Camila Rojas', 2, 'crojas@ejemplo.com'),
(11, 'Fernando Soto', 3, 'fsoto.seguridad@ejemplo.com'),
(12, 'Lucía Castro', 2, 'lcastro@ejemplo.com'),
(13, 'Ricardo Vargas', 4, 'rvargas.mant@ejemplo.com'),
(14, 'Marta Guzmán', 5, 'mguzman.visita@ejemplo.com'),
(15, 'Esteban Reyes', 7, 'ereyes@ejemplo.com');

UPDATE users SET passw = '$2b$10$wA/n.Jp7PjR5J.g7bYQ.uO1c.YfG.xQ3Q.z.qX.q.q.q.q.q.q.q.q'; --lo ocupare para probar las funciones de comparación

INSERT INTO role_zone_permissions (role_id, zone_id) VALUES 
-- Administrador (1): Acceso a todo (1 al 10)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),

-- Empleado General (2): Recepción, Comedor, Oficinas, Estacionamiento, Sala Reuniones, Zona Descanso
(2, 1), (2, 2), (2, 3), (2, 6), (2, 8), (2, 10),

-- Seguridad (3): Acceso a todo (1 al 10)
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10),

-- Mantenimiento (4): Todo excepto Oficinas Principales y Laboratorio
(4, 1), (4, 2), (4, 4), (4, 5), (4, 6), (4, 8), (4, 9), (4, 10),

-- Visita (5): Recepción, Comedor, Sala de Reuniones
(5, 1), (5, 2), (5, 8),

-- Proveedor (6): Recepción, Bodega, Estacionamiento
(6, 1), (6, 5), (6, 6),

-- Gerencia (7): Todo excepto Sala de Servidores
(7, 1), (7, 2), (7, 3), (7, 5), (7, 6), (7, 7), (7, 8), (7, 9), (7, 10);

-- Datos de prueba para el historial de accesos
INSERT INTO access_logs (user_id, zone_id, access_method, log_type, granted, timestamp) VALUES 
-- Iván (Admin) entrando y saliendo de Recepción por Cara
(1, 1, 'CARA', 'Entrada', true, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(1, 1, 'CARA', 'Salida', true, CURRENT_TIMESTAMP - INTERVAL '3 hours'),

-- María (Gerencia) entrando a Oficinas por QR
(2, 3, 'QR', 'Entrada', true, CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Carlos (Seguridad) revisando la Sala de Servidores
(3, 4, 'CARA', 'Entrada', true, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(3, 4, 'CARA', 'Salida', true, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

-- Sofía (Visita) intentando entrar a la Sala de Servidores (Acceso Denegado)
(8, 4, 'QR', 'Entrada', false, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),

-- Jorge (Proveedor) entrando a la Bodega
(9, 5, 'QR', 'Entrada', true, CURRENT_TIMESTAMP - INTERVAL '10 minutes');

-- Sincronizar el contador de access_logs
SELECT setval('access_logs_id_seq', (SELECT MAX(id) FROM access_logs));

--Esto para coordinar los SERIAL, y que al registrar a otra persona no se rompan los ID's
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('zones_id_seq', (SELECT MAX(id) FROM zones));