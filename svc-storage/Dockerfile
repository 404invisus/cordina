FROM php:8.3-fpm-alpine

RUN apk add --no-cache nginx postgresql-dev libzip-dev zip unzip git curl supervisor
RUN docker-php-ext-install pdo pdo_pgsql zip opcache pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN cp .env.example .env && php artisan key:generate

RUN chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf

RUN printf 'upload_max_filesize = 25M\npost_max_size = 30M\n' \
    > /usr/local/etc/php/conf.d/uploads.ini

EXPOSE 80
CMD ["sh", "-c", "php artisan migrate --force && php-fpm -D && nginx -g 'daemon off;'"]
