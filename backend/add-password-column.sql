-- Script para agregar el campo password a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'password';
