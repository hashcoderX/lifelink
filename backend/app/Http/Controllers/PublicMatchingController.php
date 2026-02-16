<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Patient;

class PublicMatchingController extends Controller
{
    /**
     * Public donor matching with optional authenticated patient context.
     * Query params: page, per_page, location?, blood_group?, rh_factor?
     * Returns donors with computed score and brief reasons.
     */
    public function matchDonors(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) $perPage = 10;
        if ($perPage > 50) $perPage = 50;
        $page = (int) $request->query('page', 1);
        $location = trim((string)$request->query('location', ''));

        // Resolve patient context: prefer authenticated user's patient profile
        $auth = $request->user();
        $patient = null;
        if ($auth) {
            $patient = Patient::where('user_id', $auth->id)->first();
        }
        // Fallback to ad-hoc patient-like fields from query if provided
        $patientLike = [
            'blood_group' => $patient ? $patient->blood_group : (string)$request->query('blood_group', ''),
            'rh_factor' => $patient ? $patient->rh_factor : (string)$request->query('rh_factor', ''),
            'hla_typing' => $patient ? $patient->hla_typing : null,
            'urgent_level' => $patient ? $patient->urgent_level : null,
            'location' => $patient ? $patient->location : null,
            'pra_score' => $patient ? $patient->pra_score : null,
        ];

        $query = DB::table('donors')
            ->leftJoin('contacts', 'contacts.user_id', '=', 'donors.user_id')
            ->where('donors.availability', true)
            ->where('donors.donor_type', 'KIDNEY')
            ->select(
                'donors.id', 'donors.full_name', 'donors.location as donor_location',
                'donors.blood_group', 'donors.rh_factor', 'donors.crossmatch_result', 'donors.hla_typing',
                DB::raw("COALESCE(contacts.city, donors.location) AS location"),
                'contacts.phone'
            )
            ->orderBy('donors.id', 'desc');

        if ($location !== '') {
            $query->where(function($q) use ($location) {
                $q->where('donors.location', 'like', "%{$location}%")
                  ->orWhere('contacts.city', 'like', "%{$location}%");
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Compute scores for each donor row
        $data = collect($paginator->items())->map(function ($row) use ($patientLike) {
            $donorData = is_array($row) ? $row : (array)$row;
            $scoreInfo = $this->computeScore($donorData, $patientLike);
            return array_merge($donorData, [
                'match_score' => $scoreInfo['score'],
                'reasons' => $scoreInfo['reasons'],
            ]);
        });

        $response = [
            'current_page' => $paginator->currentPage(),
            'data' => $data,
            'first_page_url' => $paginator->url(1),
            'from' => $paginator->firstItem(),
            'last_page' => $paginator->lastPage(),
            'last_page_url' => $paginator->url($paginator->lastPage()),
            'next_page_url' => $paginator->nextPageUrl(),
            'path' => $paginator->path(),
            'per_page' => $paginator->perPage(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ];

        return response()->json($response);
    }

    private function computeScore(array $donor, array $patient): array
    {
        $score = 0;
        $reasons = [];

        $dBG = $donor['blood_group'] ?? null; // e.g., 'A+' or 'O-'
        $pBG = $patient['blood_group'] ?? '';
        $dRhEnum = $donor['rh_factor'] ?? null; // POSITIVE/NEGATIVE
        $pRhEnum = $patient['rh_factor'] ?? null;

        // Normalize ABO and Rh
        $dAbo = $dBG ? rtrim($dBG, '+-') : null;
        $dRh = $dBG ? substr($dBG, -1) : ( $dRhEnum === 'NEGATIVE' ? '-' : ( $dRhEnum === 'POSITIVE' ? '+' : null));
        $pAbo = $pBG ? rtrim($pBG, '+-') : null;
        $pRh = $pBG ? substr($pBG, -1) : ( $pRhEnum === 'NEGATIVE' ? '-' : ( $pRhEnum === 'POSITIVE' ? '+' : null));

        // ABO compatibility scoring
        if ($dAbo && $pAbo) {
            if ($dAbo === $pAbo) { $score += 30; $reasons[] = 'ABO exact match'; }
            elseif ($dAbo === 'O') { $score += 25; $reasons[] = 'Universal ABO donor (O)'; }
            elseif ($pAbo === 'AB') { $score += 20; $reasons[] = 'Recipient AB accepts A/B'; }
        }

        // Rh factor preference
        if ($dRh && $pRh) {
            if ($dRh === $pRh) { $score += 10; $reasons[] = 'Rh matches'; }
            elseif ($pRh === '+') { $score += 5; $reasons[] = 'Rh+ recipient can accept Rh-'; }
        }

        // Crossmatch result (donor perspective): NEGATIVE is good
        $cross = $donor['crossmatch_result'] ?? null; // POSITIVE/NEGATIVE/UNKNOWN
        if ($cross === 'NEGATIVE') { $score += 15; $reasons[] = 'Negative crossmatch'; }
        elseif ($cross === 'UNKNOWN') { $score += 5; $reasons[] = 'Crossmatch unknown'; }
        elseif ($cross === 'POSITIVE') { $score -= 10; $reasons[] = 'Positive crossmatch'; }

        // HLA typing simple overlap scoring (up to +10)
        try {
            $dHlaRaw = $donor['hla_typing'] ?? null;
            $dHla = $dHlaRaw ? json_decode($dHlaRaw, true) : [];
            $pHlaRaw = $patient['hla_typing'] ?? null;
            $pHla = is_array($pHlaRaw) ? $pHlaRaw : (is_string($pHlaRaw) ? json_decode($pHlaRaw, true) : []);
            if ($dHla && $pHla && is_array($dHla) && is_array($pHla)) {
                $matches = count(array_intersect(array_map('strval', $dHla), array_map('strval', $pHla)));
                $hlaPts = min(10, $matches * 2);
                if ($hlaPts > 0) { $score += $hlaPts; $reasons[] = "+{$hlaPts} HLA overlap"; }
            }
        } catch (\Throwable $e) {}

        // PRA score (patient sensitization): lower is better
        $pra = $patient['pra_score'] ?? null;
        if (is_numeric($pra)) {
            if ($pra < 20) { $score += 10; $reasons[] = 'Low PRA'; }
            elseif ($pra < 40) { $score += 5; $reasons[] = 'Moderate PRA'; }
        }

        // Location preference: same city bonus
        $pLoc = $patient['location'] ?? null;
        $dLoc = $donor['location'] ?? ($donor['donor_location'] ?? null);
        if ($pLoc && $dLoc && mb_strtolower((string)$pLoc) === mb_strtolower((string)$dLoc)) {
            $score += 5; $reasons[] = 'Same location';
        }

        return ['score' => $score, 'reasons' => $reasons];
    }
}
