FROM php:8.3-fpm-alpine

RUN apk add --no-cache nginx postgresql-dev libzip-dev zip unzip git curl supervisor
RUN apk add --no-cache $PHPIZE_DEPS && pecl install redis && docker-php-ext-enable redis
RUN docker-php-ext-install pdo pdo_pgsql zip opcache pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN cp .env.example .env && php artisan key:generate

RUN chown -R www-data:www-data storage bootstrap/cache

COPY ../docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["sh", "-c", "php artisan migrate --force && php-fpm -D && nginx -g 'daemon off;'"]
