# backend/Dockerfile
FROM php:8.3-alpine

# Install system dependencies and PostgreSQL PHP extension
RUN apk add --no-cache \
    postgresql-dev \
    git \
    unzip \
    bash \
    && docker-php-ext-install pdo pdo_pgsql

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer config and run install
COPY composer.json ./
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist

# Copy project files
COPY src/ ./src/
COPY public/ ./public/

# Optimize autoloader
RUN composer dump-autoload --optimize --no-dev

# Expose HTTP port
EXPOSE 8080

# Run PHP built-in web server serving public folder
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
