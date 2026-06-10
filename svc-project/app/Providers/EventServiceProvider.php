<?php
namespace App\Providers;
use App\Events\TaskAssigned;
use App\Listeners\NotifyTaskAssigned;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        TaskAssigned::class => [
            NotifyTaskAssigned::class,
        ],
    ];
    public function boot(): void
    {
        parent::boot();
    }
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
