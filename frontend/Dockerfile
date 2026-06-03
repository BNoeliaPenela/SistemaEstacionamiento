# 1. Etapa de compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Etapa de producción con Nginx
FROM nginx:alpine
# Copiamos los archivos compilados de React a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos una configuración básica de Nginx para manejar rutas de React
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]