<?php

namespace App\Http\Controllers;

use App\Models\MedicalReport;
use App\Models\Patient;
use App\Services\OcrService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MedicalReportController extends Controller
{
    private array $allowedTypes = [
        'Other Report',
        'Blood Group (ABO Typing)',
        'HLA Typing (Human Leukocyte Antigen)',
        'PRA Text Report',
        'Crossmatch Report',
        'Kidney Function Report',
        'Infection Screening Report',
        'Infaction Screening Report',
        // Legacy granular types kept for compatibility
        'Rh Factor (Positive/Negative)',
        'Crossmatch Test',
        'PRA (Panel Reactive Antibody)',
        'Serum Creatinine',
        'GFR (Glomerular Filtration Rate)',
        'Urea Level',
        'Urinalysis Report',
        'Electrolyte Panel (Na, K, Cl)',
        'HIV Test',
        'Hepatitis B (HBsAg, Anti-HBc)',
        'Hepatitis C (Anti-HCV)',
        'CMV (Cytomegalovirus)',
        'VDRL (Syphilis Test)',
        'Ultrasound of Kidneys',
        'CT Angiogram (Renal Vessels)',
    ];

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MedicalReport::query();
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if ($request->has('donor_id')) {
            $query->where('donor_id', $request->integer('donor_id'));
        }
        return response()->json($query->paginate(25));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'patient_id' => ['required','exists:patients,id'],
            'donor_id' => ['nullable','exists:donors,id'],
            'report_type' => ['nullable','string','max:150', Rule::in($this->allowedTypes)],
            'summary' => ['nullable','string'],
            'data' => ['nullable','array'],
        ]);
        $report = MedicalReport::create($data);
        return response()->json($report, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MedicalReport $medicalReport)
    {
        return response()->json($medicalReport);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MedicalReport $medicalReport)
    {
        $data = $request->validate([
            'donor_id' => ['nullable','exists:donors,id'],
            'report_type' => ['sometimes','string','max:150', Rule::in($this->allowedTypes)],
            'summary' => ['sometimes','string'],
            'data' => ['sometimes','array'],
        ]);
        $medicalReport->update($data);
        return response()->json($medicalReport);
    }

    /**
     * List reports for the authenticated user's patient.
     */
    public function me(Request $request)
    {
        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['message' => 'No patient profile found for user'], 404);
        }
        $reports = MedicalReport::where('patient_id', $patient->id)->orderBy('created_at','desc')->get();
        return response()->json(['reports' => $reports]);
    }

    /**
     * Upload a medical report file for the authenticated user's patient.
     * Creates or updates a MedicalReport record keyed by report_type.
     */
    public function uploadMe(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient;
        if (!$patient) {
            return response()->json(['message' => 'No patient profile found for user'], 404);
        }

        $validated = $request->validate([
            'report_type' => ['required', 'string', 'max:150', Rule::in($this->allowedTypes)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'], // up to 10MB
            'summary' => ['nullable', 'string']
        ]);

        $file = $validated['file'];
        $dir = 'medical-reports/'.$patient->id;
        $storedPath = $file->store($dir, 'public');
        $fileUrl = asset('storage/'.$storedPath);

        $report = MedicalReport::firstOrNew([
            'patient_id' => $patient->id,
            'report_type' => $validated['report_type'],
        ]);
        $report->patient_id = $patient->id;
        $report->report_type = $validated['report_type'];
        if (isset($validated['summary'])) {
            $report->summary = $validated['summary'];
        }
        $data = $report->data ?: [];
        $data['file_path'] = $storedPath;
        $data['file_url'] = $fileUrl;
        $data['original_name'] = $file->getClientOriginalName();
        $data['mime_type'] = $file->getClientMimeType();
        $data['size'] = $file->getSize();

        // OCR + auto-populate patient fields based on report type
        try {
            $ocr = app(OcrService::class);
            $fullPath = storage_path('app/public/'.$storedPath);
            $ocrText = $ocr->extract($fullPath, $file->getClientMimeType());
            if ($ocrText && trim($ocrText) !== '') {
                $data['ocr_text'] = $ocrText;
                $this->applyParsedValuesToPatient($patient, $validated['report_type'], $ocrText);
                $patient->save();
            }
        } catch (\Throwable $e) {
            // Non-fatal – continue saving report
        }
        $report->data = $data;
        $report->save();

        return response()->json(['report' => $report], 201);
    }

    private function applyParsedValuesToPatient(Patient $patient, string $reportType, string $text): void
    {
        $lower = strtolower($text);
        switch ($reportType) {
            case 'Blood Group (ABO Typing)':
                // ABO
                $abo = null; if (preg_match('/\b(abo|blood\s*group)\b[^ABO]*\b(A|B|AB|O)\b/i', $text, $m)) { $abo = strtoupper($m[2]); }
                if (!$abo && preg_match('/\b\b(A|B|AB|O)\b[\s\-]*[\+\-]/i', $text, $m)) { $abo = strtoupper($m[1]); }
                // Rh
                $rh = null;
                if (preg_match('/\b(rh|rhesus)\b[^\w]*\b(positive|negative|pos|neg|\+|\-)\b/i', $text, $m)) {
                    $val = strtolower($m[2]); $rh = ($val === 'positive' || $val === 'pos' || $val === '+') ? 'POSITIVE' : 'NEGATIVE';
                } elseif (preg_match('/\b([ABO]{1,2}|A|B|AB|O)\b\s*(\+|\-)/i', $text, $m)) {
                    $rh = ($m[2] === '+') ? 'POSITIVE' : 'NEGATIVE';
                }
                if ($abo) {
                    $sign = $rh === 'NEGATIVE' ? '-' : ($rh === 'POSITIVE' ? '+' : '');
                    if ($sign) { $patient->blood_group = $abo . $sign; }
                }
                if ($rh) { $patient->rh_factor = $rh; }
                break;
            case 'PRA Text Report':
            case 'PRA (Panel Reactive Antibody)':
                if (preg_match('/\bpra\b[^\d%]*(\d+(?:\.\d+)?)\s*%/i', $text, $m)) {
                    $patient->pra_score = (float)$m[1];
                }
                break;
            case 'Crossmatch Report':
            case 'Crossmatch Test':
                if (preg_match('/\bcross\s*match\b[^\w]*(positive|negative)/i', $lower, $m)) {
                    $patient->crossmatch_result = strtoupper($m[1]) === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
                }
                // DSA optional
                if (preg_match('/\bdsa\b[^\w]*(positive|negative)/i', $lower, $m)) {
                    $patient->dsa = strtoupper($m[1]) === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
                }
                break;
            case 'Kidney Function Report':
                if (preg_match('/creatinine\s*[:\-]?\s*(\d+(?:\.\d+)?)/i', $text, $m)) { $patient->current_creatinine = (float)$m[1]; }
                if (preg_match('/\bgfr\b[^\d]*(\d+(?:\.\d+)?)/i', $text, $m)) { $patient->gfr = (float)$m[1]; }
                if (preg_match('/\burea\b[^\d]*(\d+(?:\.\d+)?)/i', $text, $m)) { $patient->urea_level = (float)$m[1]; }
                break;
            case 'Infection Screening Report':
            case 'Infaction Screening Report':
                $patient->hiv_status = $this->extractPositiveNegative($lower, 'hiv');
                $patient->hbv_status = $this->extractPositiveNegative($lower, 'hbv|hbsag|hepatitis\s*b');
                $patient->hcv_status = $this->extractPositiveNegative($lower, 'hcv|hepatitis\s*c');
                break;
            case 'HLA Typing (Human Leukocyte Antigen)':
                // Collect common HLA pattern like HLA-A*02:01 etc as a comma-separated list
                $matches = [];
                if (preg_match_all('/hla\-?[abdrdqcp]?\*?\s?([0-9A-Za-z:]+)/i', $text, $mm)) {
                    $matches = array_values(array_unique($mm[0]));
                }
                if (!empty($matches)) {
                    // store as joined string in patient diagnosis or location? Here skip; typically saved in patient.hla_typing array via frontend only.
                }
                break;
            default:
                // No auto mapping
                break;
        }
    }

    private function extractPositiveNegative(string $lowerText, string $termRegex): ?string
    {
        if (preg_match('/\b(' . $termRegex . ')\b[^\w]*(positive|negative)/i', $lowerText, $m)) {
            return strtoupper($m[2]) === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
        }
        return null;
    }

    /**
     * List reports for the authenticated user's donor.
     */
    public function meDonor(Request $request)
    {
        $donor = $request->user()->donor;
        if (!$donor) {
            return response()->json(['message' => 'No donor profile found for user'], 404);
        }
        $reports = MedicalReport::where('donor_id', $donor->id)->orderBy('created_at','desc')->get();
        return response()->json(['reports' => $reports]);
    }

    /**
     * Upload a medical report file for the authenticated user's donor.
     * Creates or updates a MedicalReport record keyed by report_type.
     */
    public function uploadDonorMe(Request $request)
    {
        $user = $request->user();
        $donor = $user->donor;
        if (!$donor) {
            return response()->json(['message' => 'No donor profile found for user'], 404);
        }

        $validated = $request->validate([
            'report_type' => ['required', 'string', 'max:150', Rule::in($this->allowedTypes)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'], // up to 10MB
            'summary' => ['nullable', 'string']
        ]);

        $file = $validated['file'];
        $dir = 'medical-reports-donor/'.$donor->id;
        $storedPath = $file->store($dir, 'public');
        $fileUrl = asset('storage/'.$storedPath);

        $report = MedicalReport::firstOrNew([
            'donor_id' => $donor->id,
            'report_type' => $validated['report_type'],
        ]);
        $report->donor_id = $donor->id;
        $report->report_type = $validated['report_type'];
        if (isset($validated['summary'])) {
            $report->summary = $validated['summary'];
        }
        $data = $report->data ?: [];
        $data['file_path'] = $storedPath;
        $data['file_url'] = $fileUrl;
        $data['original_name'] = $file->getClientOriginalName();
        $data['mime_type'] = $file->getClientMimeType();
        $data['size'] = $file->getSize();
        $report->data = $data;
        $report->save();

        return response()->json(['report' => $report], 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MedicalReport $medicalReport)
    {
        $medicalReport->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
