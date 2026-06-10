<?php

namespace App\Providers;

use App\Services\AuthServiceClient;
use App\Services\ProjectServiceClient;
use App\Services\ReportService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuthServiceClient::class);
        $this->app->singleton(ProjectServiceClient::class);

        $this->app->singleton(ReportService::class, function ($app) {
            return new ReportService(
                $app->make(AuthServiceClient::class),
                $app->make(ProjectServiceClient::class),
            );
        });
    }

    public function boot(): void {}
}
