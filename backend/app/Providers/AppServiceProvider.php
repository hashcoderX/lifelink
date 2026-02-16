<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Donor;
use App\Models\Patient;
use App\Observers\DonorObserver;
use App\Observers\PatientObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Donor::observe(DonorObserver::class);
        Patient::observe(PatientObserver::class);
    }
}
