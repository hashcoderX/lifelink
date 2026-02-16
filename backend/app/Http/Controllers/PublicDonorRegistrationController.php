<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Donor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\OcrService;

class PublicDonorRegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function store(Request $request)
    {
        Log::info('Donor registration request received', [
            'has_front' => $request->hasFile('front'),
            'has_back' => $request->hasFile('back'),
            'donor_type' => $request->input('donor_type'),
            'user_authenticated' => $request->user() ? 'yes' : 'no',
            'user_id' => $request->user()?->id,
        ]);

        $request->validate([
            'front' => ['nullable','file','mimes:pdf,jpg,jpeg,png','max:5120'],
            'back' => ['nullable','file','mimes:pdf,jpg,jpeg,png','max:5120'],
            'donor_type' => ['nullable','string','in:BLOOD,KIDNEY,EYE'],
            // Contact details
            'phone' => ['required','string','max:32'],
            'whatsapp' => ['nullable','string','max:32'],
            'location' => ['nullable','string','max:100'],
            'country' => ['nullable','string','max:100'],
            // Blood group fields: collect ABO and Rh separately
            'blood_group' => ['nullable','string','in:A,B,AB,O'],
            'rh' => ['nullable','string','in:+,-'],
            // Additional fields
            'age' => ['nullable','integer','min:18','max:100'],
            'bmi' => ['nullable','numeric','min:10','max:50'],
            'sex' => ['nullable','string','in:M,F'],
            'hla_typing' => ['nullable','string','max:500'],
            'crossmatch_result' => ['nullable','string','max:500'],
            'pra_score' => ['nullable','numeric','min:0','max:100'],
            'creatinine_level' => ['nullable','numeric','min:0'],
            'gfr' => ['nullable','numeric','min:0'],
            'urea_level' => ['nullable','numeric','min:0'],
            'dsa' => ['nullable','string','max:500'],
            'infectious_test_results' => ['nullable','string'],
            'diabetes' => ['nullable','boolean'],
            'hypertension' => ['nullable','boolean'],
            'rejection_history' => ['nullable','boolean'],
            'previous_transplant' => ['nullable','boolean'],
        ]);

        $donorType = (string)$request->input('donor_type', 'BLOOD');
        if ($donorType === '') { $donorType = 'BLOOD'; }

        $user = $request->user();
        if (!$user) {
            Log::error('No authenticated user found');
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $front = $request->file('front');
        $back = $request->file('back');
        // Contact inputs (default empty strings to satisfy static analysis)
        $phone = (string)$request->input('phone', '');
        $whatsapp = (string)$request->input('whatsapp', '');
        $location = (string)$request->input('location', '');
        $country = (string)$request->input('country', '');
        $abo = strtoupper((string)$request->input('blood_group', ''));
        $rh = (string)$request->input('rh', ''); // '+' | '-'

        Log::info('Validation passed, processing donor registration', [
            'donor_type' => $donorType,
            'user_id' => $user->id,
        ]);

        // Additional validation for BLOOD and EYE donors - require both front and back files
        if (($donorType === 'BLOOD' || $donorType === 'EYE') && (!$request->hasFile('front') || !$request->hasFile('back'))) {
            Log::warning('Validation failed: missing files for BLOOD/EYE donor', ['donor_type' => $donorType]);
            throw ValidationException::withMessages([
                'front' => 'Both front and back of NIC/License are required for blood and eye donors.',
                'back' => 'Both front and back of NIC/License are required for blood and eye donors.',
            ]);
        }

        // Compute combined blood group (e.g., A+) and rh_factor enum (POSITIVE/NEGATIVE)
        $rhSigned = $rh === '-' ? '-' : ($rh === '+' ? '+' : '');
        $bloodGroupCombined = ($abo && $rhSigned) ? ($abo . $rhSigned) : null;
        $rhEnum = $rh === '-' ? 'NEGATIVE' : ($rh === '+' ? 'POSITIVE' : null);

        // Store identity document if provided
        $pathFront = null;
        $mimeFront = null;
        $pathBack = null;
        $mimeBack = null;
        $ocrText = null;
    $ocrTextBack = null;
    $nic = null;
    if ($front) {
        $pathFront = $front->store('donors');
        $mimeFront = $front->getMimeType();
        $fullPathFront = storage_path('app/' . $pathFront);
        try {
            $ocrText = (new OcrService())->extract($fullPathFront, (string)$mimeFront);
        } catch (\Throwable $e) {
            Log::warning('Donor OCR failed: ' . $e->getMessage());
        }
    }
    if ($back) {
        $pathBack = $back->store('donors');
        $mimeBack = $back->getMimeType();
        $fullPathBack = storage_path('app/' . $pathBack);
        try {
            $ocrTextBack = (new OcrService())->extract($fullPathBack, (string)$mimeBack);
        } catch (\Throwable $e) {
            Log::warning('Donor OCR failed: ' . $e->getMessage());
        }
    }
    if ($ocrText || $ocrTextBack) {
        $nic = (new OcrService())->extractNicNumber(($ocrText ?? '') . "\n" . ($ocrTextBack ?? ''));
    }

        // Create donor record
        $donor = Donor::create([
            'user_id' => $user->id,
            'full_name' => $user->name,
            'availability' => true,
            'donor_type' => $donorType,
            'blood_group' => $bloodGroupCombined,
            'rh_factor' => $rhEnum,
            'identity_doc_path' => $pathFront,
            'identity_doc_mime' => $mimeFront,
            'identity_doc_back_path' => $pathBack,
            'identity_doc_back_mime' => $mimeBack,
            'identity_ocr_text' => $ocrText,
            'identity_ocr_text_back' => $ocrTextBack,
            'nic_number' => $nic,
            // Additional fields
            'age' => $request->input('age'),
            'bmi' => $request->input('bmi'),
            'sex' => $request->input('sex'),
            'hla_typing' => $request->input('hla_typing') ? explode(',', $request->input('hla_typing')) : null,
            'crossmatch_result' => $request->input('crossmatch_result'),
            'pra_score' => $request->input('pra_score'),
            'creatinine_level' => $request->input('creatinine_level'),
            'gfr' => $request->input('gfr'),
            'urea_level' => $request->input('urea_level'),
            'dsa' => $request->input('dsa'),
            'infectious_test_results' => $request->input('infectious_test_results') ? json_decode($request->input('infectious_test_results'), true) : null,
            'diabetes' => $request->boolean('diabetes'),
            'hypertension' => $request->boolean('hypertension'),
            'rejection_history' => $request->boolean('rejection_history'),
            'previous_transplant' => $request->boolean('previous_transplant'),
        ]);

        // Create contact record for the new user
        try {
            \App\Models\Contact::create([
                'user_id' => $user->id,
                'phone' => $phone,
                'whatsapp' => $whatsapp ?: null,
                // Map generic "location" to city; can be refined later
                'city' => $location ?: null,
                'country' => $country ?: null,
            ]);
        } catch (\Throwable $e) {
            // Non-fatal: log and continue
            Log::warning('Failed to create contact for donor user '.$user->id.': '.$e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'user_id' => $user->id,
            'donor_id' => $donor->id,
            'nic_number' => $nic,
            'ocr_text_front' => $ocrText,
            'ocr_text_back' => $ocrTextBack,
            'phone' => $phone,
            'whatsapp' => $whatsapp ?: null,
            'location' => $location ?: null,
            'country' => $country ?: null,
            'blood_group' => $bloodGroupCombined,
            'rh_factor' => $rhEnum,
            'donor_type' => $donorType,
            // Additional fields
            'age' => $donor->age,
            'bmi' => $donor->bmi,
            'sex' => $donor->sex,
            'hla_typing' => $donor->hla_typing,
            'crossmatch_result' => $donor->crossmatch_result,
            'pra_score' => $donor->pra_score,
            'creatinine_level' => $donor->creatinine_level,
            'gfr' => $donor->gfr,
            'urea_level' => $donor->urea_level,
            'dsa' => $donor->dsa,
            'infectious_test_results' => $donor->infectious_test_results,
            'diabetes' => $donor->diabetes,
            'hypertension' => $donor->hypertension,
            'rejection_history' => $donor->rejection_history,
            'previous_transplant' => $donor->previous_transplant,
        ]);
    }
}
