-- Añade Rare-candy al catálogo de ítems si aún no existe.
INSERT INTO ITEMS (nombre, precio, efecto)
SELECT 'Rare-candy', 1, 'LEVEL_UP'
WHERE NOT EXISTS (SELECT 1 FROM ITEMS WHERE nombre = 'Rare-candy');
