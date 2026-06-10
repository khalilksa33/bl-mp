# backend/Dockerfile
FROM php:8.3-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    postgresql-dev \
    git \
    unzip \
    bash \
    && docker-php-ext-install pdo pdo_pgsql opcache

# Set recommended PHP configuration settings (OPcache, memory limit, etc.)
RUN { \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=8'; \
        echo 'opcache.max_accelerated_files=4000'; \
        echo 'opcache.revalidate_freq=2'; \
        echo 'opcache.fast_shutdown=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy project files
COPY src/ ./src/

# Expose PHP-FPM port
EXPOSE 9000

CMD ["php-fpm"]
