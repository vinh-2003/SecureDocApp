# STAGE 1: Build Node.js
FROM node:18-alpine AS build
WORKDIR /app

# Khai báo Build Argument để nhận biến môi trường khi build
ARG REACT_APP_API_URL
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_BACKEND_URL

# Thiết lập biến môi trường cho quá trình build React
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

COPY package.json .
COPY package-lock.json . 
# Nếu bạn dùng yarn thì copy yarn.lock

RUN npm install

COPY . .
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine
# Copy build folder từ stage 1 vào thư mục html của nginx
COPY --from=build /app/build /usr/share/nginx/html
# Copy file cấu hình nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]