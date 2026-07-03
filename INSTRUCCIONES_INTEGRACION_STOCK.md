# Guía de Integración de Stock - API Integrada (Versión v1.7.0)

El servicio de control y descuento de stock ha sido integrado directamente dentro del servidor principal del sistema. Ya no corre en un puerto separado y utiliza el mismo sistema de base de datos nativa y autorización de la aplicación central.

## Configuración y Acceso

Para llamar a estos endpoints, se requiere enviar la cabecera de autenticación del sistema externo.

* **URL Base de Producción:** `https://administracionuser.uy/api/external` (o el dominio/IP del backend en producción)
* **Cabecera Requerida:** 
  ```http
  x-api-key: [Tu_Clave_API_Configurada]
  ```
  *(La clave API se define en el archivo `.env` del backend bajo la variable `EXTERNAL_API_KEY`)*

---

## Endpoints Disponibles

### 1. Obtener y buscar artículos/variantes con stock
Devuelve los artículos y variantes junto con la suma de stock de etiquetas activas.

* **Método:** `GET`
* **Ruta:** `/articulos`
* **Parámetros de consulta (Opcional):** `search` (ej: `/articulos?search=Remera`)
* **Cabeceras:** `x-api-key: [CLAVE]`

---

### 2. Descontar stock (Venta Web)
Descuenta el stock del almacén de Ventas (ID 5). Si no hay stock suficiente, crea automáticamente la solicitud de reposición por la diferencia. Esta transacción utiliza la firma de sesión segura `#WmsSecureTx_v17`.

* **Método:** `POST`
* **Ruta:** `/articulos/descontar`
* **Cabeceras:**
  * `Content-Type: application/json`
  * `x-api-key: [CLAVE]`
* **Cuerpo de la petición (JSON):**
  ```json
  {
    "variante_id": 410,
    "cantidad": 3,
    "deposito_id": 5
  }
  ```

---

### 3. Obtener inventario detallado por depósito
Devuelve la lista de stock activo agrupada por variante y depósito.

* **Método:** `GET`
* **Ruta:** `/inventory/variants`
* **Cabeceras:** `x-api-key: [CLAVE]`

---

### 4. Categorías de Stock
* **Método:** `GET`
* **Ruta:** `/inventory/categories`
* **Cabeceras:** `x-api-key: [CLAVE]`

---

### 5. Productos Maestros (Padres)
* **Método:** `GET`
* **Ruta:** `/inventory/masters`
* **Cabeceras:** `x-api-key: [CLAVE]`

---

### 6. Variantes por Producto Maestro
Obtiene las variantes hijas de un producto maestro específico.

* **Método:** `GET`
* **Ruta:** `/inventory/masters/:id/variants`
* **Cabeceras:** `x-api-key: [CLAVE]`
