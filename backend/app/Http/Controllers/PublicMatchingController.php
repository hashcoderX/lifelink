<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicMatchingController extends Controller
{
    public function matchDonors(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) $perPage = 10;
        if ($perPage > 50) $perPage = 50;

        $page = (int) $request->query('page', 1);
        $location = trim((string)$request->query('location', ''));

        $auth = $request->user();
        $patient = null;
        if ($auth) {
            $patient = Patient::where('user_id', $auth->id)->first();
        }

        $patientLike = [
            'blood_group' => $patient ? $patient->blood_group : (string)$request->query('blood_group', ''),
            'rh_factor' => $patient ? $patient->rh_factor : (string)$request->query('rh_factor', ''),
            'hla_typing' => $patient ? $patient->hla_typing : $request->query('hla_typing', null),
            'crossmatch_result' => $patient ? $patient->crossmatch_result : $request->query('crossmatch_result', null),
            'pra_score' => $patient ? $patient->pra_score : $request->query('pra_score', null),
            'age' => $patient ? $patient->age : $request->query('age', null),
            'bmi' => $patient ? $patient->bmi : $request->query('bmi', null),
            'diagnosis' => $patient ? $patient->diagnosis : $request->query('medical_history', null),
            'previous_transplant' => $patient ? $patient->previous_transplant : $request->query('previous_transplant', null),
            'location' => $patient ? $patient->location : $request->query('location', null),
        ];

        $query = DB::table('donors')
            ->leftJoin('contacts', 'contacts.user_id', '=', 'donors.user_id')
            ->where('donors.availability', true)
            ->where('donors.donor_type', 'KIDNEY')
            ->select(
                'donors.id',
                'donors.full_name',
                'donors.location as donor_location',
                'donors.blood_group',
                'donors.rh_factor',
                'donors.crossmatch_result',
                'donors.hla_typing',
                'donors.gfr',
                'donors.creatinine_level',
                'donors.age',
                'donors.bmi',
                'donors.medical_history',
                'donors.diabetes',
                'donors.hypertension',
                DB::raw("COALESCE(contacts.location, contacts.city, donors.location) AS location"),
                'contacts.phone'
            )
            ->orderBy('donors.id', 'desc');

        if ($location !== '') {
            $query->where(function ($q) use ($location) {
                $q->where('donors.location', 'like', "%{$location}%")
                  ->orWhere('contacts.location', 'like', "%{$location}%")
                  ->orWhere('contacts.city', 'like', "%{$location}%");
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $data = collect($paginator->items())->map(function ($row) use ($patientLike) {
            $donorData = is_array($row) ? $row : (array)$row;
            $evaluation = $this->evaluateDonor($donorData, $patientLike);

            return array_merge($donorData, [
                'donor_id' => $donorData['id'] ?? null,
                'final_match_score' => $evaluation['final_score'],
                'match_score' => round($evaluation['final_score'] * 100, 2),
                'risk_level' => $evaluation['risk_level'],
                'action' => $evaluation['action'],
                'status' => $evaluation['status'],
                'reasons' => $evaluation['reasons'],
                'warnings' => $evaluation['warnings'],
                'subscores' => $evaluation['subscores'],
                'doctor_confirmation_required' => true,
            ]);
        });

        return response()->json([
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
            'ethics' => [
                'auto_approve' => false,
                'doctor_confirmation_required' => true,
                'message' => 'LifeLink assists, doctors decide.',
            ],
        ]);
    }

    private function evaluateDonor(array $donor, array $patient): array
    {
        $warnings = [];
        $reasons = [];
        $subscores = [
            'hla_score' => 0.0,
            'pra_score' => 0.0,
            'kidney_score' => 0.0,
            'age_score' => 0.0,
            'bmi_score' => 0.0,
        ];

        $dBG = strtoupper((string)($donor['blood_group'] ?? ''));
        $pBG = strtoupper((string)($patient['blood_group'] ?? ''));
        $dCross = strtoupper((string)($donor['crossmatch_result'] ?? 'UNKNOWN'));
        $pCross = strtoupper((string)($patient['crossmatch_result'] ?? 'UNKNOWN'));

        $dAbo = $this->aboFromBloodGroup($dBG);
        $pAbo = $this->aboFromBloodGroup($pBG);

        if ($dAbo && $pAbo && !$this->isAboCompatible($dAbo, $pAbo)) {
            return [
                'status' => 'REJECTED',
                'final_score' => 0.0,
                'risk_level' => 'Very High',
                'action' => 'Avoid',
                'reasons' => ["Blood group incompatibility ({$dBG} → {$pBG})"],
                'warnings' => ['Hard rejection rule triggered: ABO incompatibility'],
                'subscores' => $subscores,
            ];
        }

        if ($dCross === 'POSITIVE' || $pCross === 'POSITIVE') {
            return [
                'status' => 'REJECTED',
                'final_score' => 0.0,
                'risk_level' => 'Very High',
                'action' => 'Avoid',
                'reasons' => ['Crossmatch result is POSITIVE'],
                'warnings' => ['Hard rejection rule triggered: Positive crossmatch'],
                'subscores' => $subscores,
            ];
        }

        $gfr = is_numeric($donor['gfr'] ?? null) ? (float)$donor['gfr'] : null;
        $creatinine = is_numeric($donor['creatinine_level'] ?? null) ? (float)$donor['creatinine_level'] : null;

        $highRiskKidney = false;
        if (($gfr !== null && $gfr < 60) || ($creatinine !== null && $creatinine > 1.3)) {
            $highRiskKidney = true;
            $warnings[] = 'Donor kidney function marked HIGH RISK (GFR<60 or Creatinine>1.3)';
        }

        $diabetes = filter_var($donor['diabetes'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $hypertension = filter_var($donor['hypertension'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($diabetes || $hypertension) {
            return [
                'status' => 'REJECTED',
                'final_score' => 0.0,
                'risk_level' => 'Very High',
                'action' => 'Avoid',
                'reasons' => ['Severe donor condition risk (diabetes/hypertension)'],
                'warnings' => ['Medical safety hard rejection triggered'],
                'subscores' => $subscores,
            ];
        }

        $donorHla = $this->normalizeHla($donor['hla_typing'] ?? null);
        $patientHla = $this->normalizeHla($patient['hla_typing'] ?? null);
        $hlaMatchCount = 0;
        if (count($donorHla) > 0 && count($patientHla) > 0) {
            $hlaMatchCount = count(array_intersect($donorHla, $patientHla));
        }

        $pra = is_numeric($patient['pra_score'] ?? null) ? (float)$patient['pra_score'] : 0.0;
        if ($pra > 80 && $hlaMatchCount < 4) {
            return [
                'status' => 'REJECTED',
                'final_score' => 0.0,
                'risk_level' => 'Very High',
                'action' => 'Avoid',
                'reasons' => ["High PRA ({$pra}%) requires HLA match >= 4; current {$hlaMatchCount}/6"],
                'warnings' => ['Immunological hard requirement not satisfied'],
                'subscores' => $subscores,
            ];
        }

        $subscores['hla_score'] = $this->clamp($hlaMatchCount / 6.0);
        $subscores['pra_score'] = $this->clamp(1 - ($pra / 100.0));
        $subscores['kidney_score'] = $this->kidneyScore($gfr, $creatinine);

        $pAge = is_numeric($patient['age'] ?? null) ? (float)$patient['age'] : null;
        $dAge = is_numeric($donor['age'] ?? null) ? (float)$donor['age'] : null;
        if ($pAge !== null && $dAge !== null) {
            $ageDiffRatio = min(abs($pAge - $dAge) / 40.0, 1.0);
            $subscores['age_score'] = $this->clamp(1 - $ageDiffRatio);
        } else {
            $subscores['age_score'] = 0.5;
            $warnings[] = 'Age data incomplete; neutral age score applied';
        }

        $pBmi = is_numeric($patient['bmi'] ?? null) ? (float)$patient['bmi'] : null;
        $dBmi = is_numeric($donor['bmi'] ?? null) ? (float)$donor['bmi'] : null;
        if ($pBmi !== null && $dBmi !== null) {
            $bmiDiffRatio = min(abs($pBmi - $dBmi) / 15.0, 1.0);
            $subscores['bmi_score'] = $this->clamp(1 - $bmiDiffRatio);
        } else {
            $subscores['bmi_score'] = 0.5;
            $warnings[] = 'BMI data incomplete; neutral BMI score applied';
        }

        $finalScore =
            ($subscores['hla_score'] * 0.40) +
            ($subscores['pra_score'] * 0.20) +
            ($subscores['kidney_score'] * 0.20) +
            ($subscores['age_score'] * 0.10) +
            ($subscores['bmi_score'] * 0.10);

        if ($pra > 50 && $hlaMatchCount < 3) {
            $finalScore = max(0.0, $finalScore - 0.20);
            $warnings[] = "Heavy PRA/HLA penalty applied (PRA {$pra}%, HLA {$hlaMatchCount}/6)";
        }

        $previousTransplant = filter_var($patient['previous_transplant'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($previousTransplant) {
            $finalScore = max(0.0, $finalScore - 0.10);
            $warnings[] = 'Previous transplant increases rejection risk';
        }

        if ($highRiskKidney) {
            $finalScore = max(0.0, $finalScore - 0.10);
        }

        [$riskLevel, $action] = $this->classifyRisk($finalScore);

        $reasons[] = "HLA match: {$hlaMatchCount}/6";
        $reasons[] = "PRA: {$pra}%";
        $reasons[] = 'Crossmatch: ' . ($dCross ?: 'UNKNOWN');
        $reasons[] = 'Kidney function score: ' . number_format($subscores['kidney_score'], 2);

        return [
            'status' => 'EVALUATED',
            'final_score' => round($this->clamp($finalScore), 4),
            'risk_level' => $riskLevel,
            'action' => $action,
            'reasons' => $reasons,
            'warnings' => $warnings,
            'subscores' => [
                'hla_score' => round($subscores['hla_score'], 4),
                'pra_score' => round($subscores['pra_score'], 4),
                'kidney_score' => round($subscores['kidney_score'], 4),
                'age_score' => round($subscores['age_score'], 4),
                'bmi_score' => round($subscores['bmi_score'], 4),
            ],
        ];
    }

    private function aboFromBloodGroup(?string $bg): ?string
    {
        $bg = strtoupper(trim((string)$bg));
        if ($bg === '') return null;
        return str_replace(['+', '-'], '', $bg);
    }

    private function isAboCompatible(string $donorAbo, string $patientAbo): bool
    {
        $map = [
            'O' => ['O', 'A', 'B', 'AB'],
            'A' => ['A', 'AB'],
            'B' => ['B', 'AB'],
            'AB' => ['AB'],
        ];

        return in_array($patientAbo, $map[$donorAbo] ?? [], true);
    }

    private function normalizeHla($raw): array
    {
        if (is_array($raw)) {
            return array_values(array_filter(array_map(fn($x) => strtoupper(trim((string)$x)), $raw)));
        }

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map(fn($x) => strtoupper(trim((string)$x)), $decoded)));
            }
            $parts = array_map('trim', explode(',', $raw));
            return array_values(array_filter(array_map(fn($x) => strtoupper((string)$x), $parts)));
        }

        return [];
    }

    private function kidneyScore(?float $gfr, ?float $creatinine): float
    {
        $gfrScore = 0.5;
        $creatinineScore = 0.5;

        if ($gfr !== null) {
            $gfrScore = $this->clamp(($gfr - 60.0) / 60.0);
        }

        if ($creatinine !== null) {
            $creatinineScore = $this->clamp((2.0 - $creatinine) / 1.3);
        }

        return $this->clamp(($gfrScore + $creatinineScore) / 2.0);
    }

    private function classifyRisk(float $score): array
    {
        if ($score >= 0.80) return ['Low Risk', 'Recommended'];
        if ($score >= 0.60) return ['Moderate', 'Acceptable'];
        if ($score >= 0.40) return ['High', 'Caution'];
        return ['Very High', 'Avoid'];
    }

    private function clamp(float $value, float $min = 0.0, float $max = 1.0): float
    {
        return max($min, min($max, $value));
    }
}
