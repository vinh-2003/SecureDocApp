# STAGE 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy file pom.xml và tải dependencies (để tận dụng Docker cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code và build
COPY src ./src
RUN mvn clean package -DskipTests

# STAGE 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cài đặt thư viện hỗ trợ xử lý ảnh/font (cần thiết cho Tika/Thumbnailator)
RUN apk add --no-cache fontconfig ttf-dejavu

# Copy file jar từ stage build
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8888

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]