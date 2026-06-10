<?php

namespace App\Providers;

use App\Services\AuthServiceClient;
use App\Services\ProjectServiceClient;
use App\Services\WorkloadService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuthServiceClient::class);
        $this->app->singleton(ProjectServiceClient::class);

        $this->app->singleton(WorkloadService::class, function ($app) {
            return new WorkloadService(
                $app->make(AuthServiceClient::class),
                $app->make(ProjectServiceClient::class),
            );
        });
    }

    public function boot(): void {}
}
