<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicBloodBankController extends Controller
{
    /**
     * Public donors list with pagination and optional location filter.
     * Returns limited fields: full_name, location, blood_group, rh_factor, phone.
     */
    public function donors(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) $perPage = 10;
        if ($perPage > 50) $perPage = 50;
        $location = trim((string)$request->query('location', ''));

        $query = DB::table('donors')
            ->leftJoin('contacts', 'contacts.user_id', '=', 'donors.user_id')
            ->where('donors.availability', true)
            ->where('donors.donor_type', 'BLOOD')
            ->select(
                'donors.id',
                'donors.full_name',
                DB::raw("COALESCE(contacts.city, donors.location) AS location"),
                'donors.blood_group',
                'donors.rh_factor',
                'contacts.phone'
            )
            ->orderBy('donors.id', 'desc');

        if ($location !== '') {
            $query->where(function($q) use ($location) {
                $q->where('donors.location', 'like', "%{$location}%")
                  ->orWhere('contacts.city', 'like', "%{$location}%");
            });
        }

        $paginator = $query->paginate($perPage);

        return response()->json($paginator);
    }
}
