<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class AdminMaintenanceController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['ADMIN'])) {
            abort(403, 'Admin only');
        }
    }

    public function backfill(Request $request)
    {
        $this->ensureAdmin($request);
        $dry = $request->boolean('dry_run', false);
        $code = Artisan::call('donors:backfill-type', $dry ? ['--dry-run' => true] : []);
        $output = Artisan::output();
        return response()->json([
            'status' => $code === 0 ? 'ok' : 'error',
            'exit_code' => $code,
            'output' => $output,
            'dry_run' => $dry,
        ]);
    }

    public function explain(Request $request)
    {
        $this->ensureAdmin($request);
        $location = trim((string)$request->query('location', ''));

        $baseBlood = "EXPLAIN SELECT donors.id FROM donors LEFT JOIN contacts ON contacts.user_id = donors.user_id WHERE donors.availability = 1 AND donors.donor_type = 'BLOOD'";
        $baseKidney = "EXPLAIN SELECT donors.id FROM donors LEFT JOIN contacts ON contacts.user_id = donors.user_id WHERE donors.availability = 1 AND donors.donor_type = 'KIDNEY'";
        $orderLimit = " ORDER BY donors.id DESC LIMIT 10";

        $bloodExplain = [];
        $kidneyExplain = [];

        if ($location !== '') {
            $like = "%{$location}%";
            $bloodExplain = DB::select($baseBlood . " AND (donors.location LIKE ? OR contacts.city LIKE ?)" . $orderLimit, [$like, $like]);
            $kidneyExplain = DB::select($baseKidney . " AND (donors.location LIKE ? OR contacts.city LIKE ?)" . $orderLimit, [$like, $like]);
        } else {
            $bloodExplain = DB::select($baseBlood . $orderLimit);
            $kidneyExplain = DB::select($baseKidney . $orderLimit);
        }

        return response()->json([
            'location' => $location ?: null,
            'blood_bank_explain' => $bloodExplain,
            'kidney_matching_explain' => $kidneyExplain,
        ]);
    }
}
