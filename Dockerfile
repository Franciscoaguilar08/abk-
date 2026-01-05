# Imagen base oficial de Python
FROM python:3.11-slim

# Evita que Python genere .pyc y fuerza logs inmediatos
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos dependencias primero (mejor cache)
COPY requirements.txt .

# Instalamos dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código
COPY . .

# Cloud Run escucha en el puerto 8080
EXPOSE 8080

# Comando para iniciar la app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
