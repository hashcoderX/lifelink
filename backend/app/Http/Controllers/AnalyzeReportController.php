<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\Report;
use OpenAI\Laravel\Facades\OpenAI;

class AnalyzeReportController extends Controller
{
    /**
     * Handle report upload, OCR, AI analysis, and return structured result.
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10 MB
        ]);

        $file = $request->file('file');
        $user = $request->user();

        // Store file
        $path = $file->store('reports'); // storage/app/reports/...
        $fullPath = storage_path('app/' . $path);
        Log::info("File stored at $path, full path $fullPath, exists: " . (file_exists($fullPath) ? 'yes' : 'no'));
        Log::info("File valid: " . ($file->isValid() ? 'yes' : 'no'));
        if (!$file->isValid()) {
            Log::info("File error: " . $file->getErrorMessage());
        }
        $mime = $file->getMimeType();

        // Extract text via OCR (Google Vision if configured, else basic fallback)
        $ocrText = '';
        try {
            $ocrText = $this->extractText($fullPath, $mime);
        } catch (\Throwable $e) {
            Log::error('OCR extraction failed: ' . $e->getMessage());
        }

        // Attempt cache reuse based on text hash
        $existing = null;
        $textHash = null;
        if ($ocrText !== null && trim($ocrText) !== '') {
            $textHash = sha1($ocrText);
            $existing = Report::where('text_hash', $textHash)->orderByDesc('id')->first();
        }

        // AI analysis (always compute fresh to avoid stale cached results)
        $aiResult = '';
        Log::info('OpenAI key present: ' . (config('services.openai.key') ? 'yes' : 'no'));
        $aiResult = $this->analyzeWithAI($ocrText);

        // Optionally persist
        $report = Report::create([
            'user_id' => $user?->id,
            'file_path' => $path,
            'file_mime' => $mime,
            'ocr_text' => $ocrText,
            'text_hash' => $textHash,
            'ai_raw_json' => $aiResult,
            'meta' => [
                'engine' => 'openai',
            ],
        ]);

        return response()->json([
            'status' => 'success',
            'ocr_text' => $ocrText,
            'ai_analysis' => $aiResult,
            'report_id' => $report->id,
        ]);
    }

    protected function extractText(string $fullPath, string $mime): string
    {
        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        Log::info("Extracting text from $fullPath, ext $ext, mime $mime");

        // If Google Vision available (API key or service account), try Vision for images
        $gcvKey = config('services.google_vision.key');
        $serviceAccountPath = env('GOOGLE_APPLICATION_CREDENTIALS');
        if ($serviceAccountPath && file_exists($serviceAccountPath)) {
            // Ensure SDK can read the service account in this PHP process
            putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $serviceAccountPath);
        }
        $hasVision = ($gcvKey && $gcvKey !== '') || ($serviceAccountPath && file_exists($serviceAccountPath));
        Log::info("Vision available: $hasVision, key present: " . ($gcvKey ? 'yes' : 'no') . ", sa present: " . ($serviceAccountPath && file_exists($serviceAccountPath) ? 'yes' : 'no'));

        if ($hasVision && in_array($ext, ['jpg','jpeg','png'])) {
            Log::info("Trying Vision for image");
            $text = $this->googleVisionTextDetection($fullPath, (string)($gcvKey ?? ''));
            if ($text) {
                Log::info("Vision succeeded for image, text length: " . strlen($text));
                return $text;
            } else {
                Log::info("Vision failed for image");
            }
        }

        // For PDFs, try to convert first page to image if ImageMagick exists
        if ($ext === 'pdf' && $this->hasImageMagick()) {
            Log::info("PDF detected, ImageMagick available, trying conversion");
            // Multi-page OCR (first 3 pages) aggregation if Vision available
            if ($hasVision) {
                Log::info("Trying multi-page Vision OCR");
                $aggregated = [];
                for ($p = 0; $p < 3; $p++) {
                    $pageImg = $this->pdfPageToPng($fullPath, $p);
                    if (!$pageImg) {
                        Log::info("Failed to convert page $p");
                        break;
                    }
                    Log::info("Converted page $p to $pageImg");
                    $pText = $this->googleVisionTextDetection($pageImg, (string)($gcvKey ?? ''));
                    if ($pText) {
                        $aggregated[] = $pText;
                        Log::info("OCR page $p succeeded, text length: " . strlen($pText));
                    } else {
                        Log::info("OCR page $p failed");
                    }
                }
                if (count($aggregated)) {
                    Log::info("Multi-page OCR succeeded, total text length: " . strlen(trim(implode("\n\n", $aggregated))));
                    return trim(implode("\n\n", $aggregated));
                } else {
                    Log::info("Multi-page OCR failed");
                }
            } else {
                Log::info("Vision not available for PDF");
                // Single page conversion fallback
                $imagePath = $this->pdfFirstPageToPng($fullPath);
                if ($imagePath && $hasVision) {
                    $text = $this->googleVisionTextDetection($imagePath, (string)($gcvKey ?? ''));
                    if ($text) return $text;
                }
            }
        } else {
            Log::info("PDF not detected or ImageMagick not available");
        }

        // Digital PDF text extraction (non-OCR) via parser before OCR fallback
        if ($ext === 'pdf') {
            Log::info("Trying PDF parser for digital text");
            $parsed = $this->pdfParseText($fullPath);
            if (strlen(trim($parsed)) > 30) { // minimal length heuristic
                Log::info("PDF parser succeeded, text length: " . strlen($parsed));
                return $parsed;
            } else {
                Log::info("PDF parser failed or too short, length: " . strlen($parsed));
            }
        }

        // Fallback: try Tesseract if available on system PATH
        if ($this->hasTesseract()) {
            Log::info("Trying Tesseract OCR");
            $imageForOcr = $fullPath;
            if ($ext === 'pdf' && $this->hasImageMagick()) {
                $img = $this->pdfFirstPageToPng($fullPath);
                if ($img) {
                    $imageForOcr = $img;
                    Log::info("Converted PDF to image for Tesseract: $img");
                } else {
                    Log::info("Failed to convert PDF for Tesseract");
                }
            }
            $txt = $this->tesseractOcr($imageForOcr);
            if (trim($txt) !== '') {
                Log::info("Tesseract succeeded, text length: " . strlen($txt));
                return $txt;
            } else {
                Log::info("Tesseract failed");
            }
        } else {
            Log::info("Tesseract not available");
        }

        Log::info("All OCR methods failed, returning empty");
        return '';
    }

    protected function googleVisionTextDetection(string $imagePath, string $apiKey): ?string
    {
        // Prefer official SDK if available (service account via GOOGLE_APPLICATION_CREDENTIALS)
        if (class_exists(\Google\Cloud\Vision\V1\ImageAnnotatorClient::class)) {
            try {
                putenv('GOOGLE_API_KEY=' . $apiKey); // In case key-based fallback used
                $client = new \Google\Cloud\Vision\V1\ImageAnnotatorClient();
                $imageData = file_get_contents($imagePath);
                $response = $client->documentTextDetection($imageData);
                $annotation = $response->getFullTextAnnotation();
                if ($annotation && $annotation->getText()) {
                    return trim($annotation->getText());
                }
                $texts = $response->getTextAnnotations();
                if (count($texts)) {
                    return trim($texts[0]->getDescription());
                }
            } catch (\Throwable $e) {
                Log::warning('Vision SDK failed, falling back to REST: ' . $e->getMessage());
            }
        }

        // REST fallback using API key only
        try {
            $content = base64_encode(file_get_contents($imagePath));
            $payload = [
                'requests' => [[
                    'image' => ['content' => $content],
                    'features' => [['type' => 'DOCUMENT_TEXT_DETECTION']],
                ]],
            ];
            $ch = curl_init('https://vision.googleapis.com/v1/images:annotate?key=' . urlencode($apiKey));
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_TIMEOUT => 30,
            ]);
            $res = curl_exec($ch);
            if ($res === false) return null;
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code >= 200 && $code < 300) {
                $data = json_decode($res, true);
                $text = $data['responses'][0]['fullTextAnnotation']['text'] ?? ($data['responses'][0]['textAnnotations'][0]['description'] ?? null);
                return $text ?: null;
            }
        } catch (\Throwable $e) {
            Log::warning('Google Vision REST call failed: ' . $e->getMessage());
        }
        return null;
    }

    protected function pdfFirstPageToPng(string $pdfPath): ?string
    {
        try {
            $tmp = storage_path('app/tmp_' . Str::uuid() . '.png');
            $cmd = 'magick convert "' . $pdfPath . '[0]" "' . $tmp . '"';
            $output = null; $ret = 1;
            @exec($cmd, $output, $ret);
            if ($ret === 0 && file_exists($tmp)) {
                return $tmp;
            }
        } catch (\Throwable $e) {
            Log::info('ImageMagick conversion failed: ' . $e->getMessage());
        }
        return null;
    }

    protected function pdfPageToPng(string $pdfPath, int $page): ?string
    {
        try {
            $tmp = storage_path('app/tmp_' . Str::uuid() . '.png');
            $cmd = 'magick convert "' . $pdfPath . '[' . $page . ']" "' . $tmp . '"';
            $output = null; $ret = 1;
            @exec($cmd, $output, $ret);
            if ($ret === 0 && file_exists($tmp)) {
                return $tmp;
            }
        } catch (\Throwable $e) {
            return null;
        }
        return null;
    }

    protected function hasTesseract(): bool
    {
        $which = stripos(PHP_OS, 'WIN') === 0 ? 'where' : 'which';
        $output = null; $ret = 1;
        @exec($which . ' tesseract', $output, $ret);
        return $ret === 0;
    }

    protected function hasImageMagick(): bool
    {
        $output = null; $ret = 1;
        @exec('magick -version', $output, $ret);
        return $ret === 0;
    }

    protected function tesseractOcr(string $imagePath): string
    {
        $outBase = storage_path('app/tmp_ocr_' . Str::uuid());
        $cmd = 'tesseract ' . escapeshellarg($imagePath) . ' ' . escapeshellarg($outBase) . ' 2>&1';
        @exec($cmd, $output, $ret);
        if ($ret !== 0) {
            Log::info('Tesseract failed: ' . implode("\n", $output));
            return '';
        }
        $txt = $outBase . '.txt';
        return file_exists($txt) ? trim(file_get_contents($txt)) : '';
    }

    protected function analyzeWithAI($text)
    {
        $text = trim((string) $text);
        if ($text === '') {
            return 'No readable text found; unable to analyze.';
        }

        // Prefer configured API key
        $apiKey = config('services.openai.key') ?: env('OPENAI_API_KEY');
        if (!$apiKey) {
            // Fallback mock when no API key configured
            return 'Mock analysis (OpenAI not configured).';
        }

        // Retry on rate limits with backoff

        $attempts = 0; $maxAttempts = 3; $lastError = null;
        while ($attempts < $maxAttempts) {
            $attempts++;
            try {
                $payload = [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a medical report analyzer. Provide a concise analysis of the lab values, noting any abnormal results and recommendations.'],
                        ['role' => 'user', 'content' => $text],
                    ],
                ];
                $ch = curl_init('https://api.openai.com/v1/chat/completions');
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'Authorization: Bearer ' . $apiKey,
                    ],
                    CURLOPT_POSTFIELDS => json_encode($payload),
                    CURLOPT_TIMEOUT => 60,
                ]);
                $res = curl_exec($ch);
                if ($res === false) throw new \RuntimeException('OpenAI HTTP error');
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($code === 429) {
                    $wait = 0.5 * $attempts; // short retry delay
                    Log::warning('OpenAI rate limited (429). Retrying in ' . $wait . 's (attempt ' . $attempts . ')');
                    sleep($wait);
                    continue;
                }
                if ($code < 200 || $code >= 300) throw new \RuntimeException('OpenAI status ' . $code);
                $data = json_decode($res, true);
                $content = $data['choices'][0]['message']['content'] ?? '';
                if (trim($content) === '') throw new \RuntimeException('Empty AI content');
                return $content;
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                Log::error('OpenAI analysis attempt ' . $attempts . ' failed: ' . $lastError);
                if ($attempts >= $maxAttempts) break;
                sleep(1);
            }
        }
        // Final fallback – heuristic, deterministic analysis
        $fallback = $this->fallbackLocalAnalysis($text);
        return $fallback;
    }

    protected function pdfParseText(string $pdfPath): string
    {
        try {
            if (!class_exists(\Smalot\PdfParser\Parser::class)) return '';
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($pdfPath);
            $pages = $pdf->getPages();
            $collected = [];
            foreach ($pages as $i => $page) {
                if ($i >= 3) break; // Limit to first 3 pages
                $collected[] = $page->getText();
            }
            return trim(implode("\n\n", $collected));
        } catch (\Throwable $e) {
            Log::info('PDF parse failed: ' . $e->getMessage());
            return '';
        }
    }

    protected function basicLabFindingScan(string $text): array
    {
        $findings = [];
        $lower = strtolower($text);

        // Simple regex patterns for common labs (non-unit aware, heuristic only)
        $patterns = [
            'creatinine' => '/creatinine\s*[:\-]?\s*(\d+(?:\.\d+)?)/i',
            'hemoglobin' => '/hemoglobin\s*[:\-]?\s*(\d+(?:\.\d+)?)/i',
            'glucose' => '/glucose\s*[:\-]?\s*(\d+(?:\.\d+)?)/i',
            'urea' => '/urea\s*[:\-]?\s*(\d+(?:\.\d+)?)/i',
            'platelet' => '/platelet\s*count\s*[:\-]?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i',
        ];
        foreach ($patterns as $name => $regex) {
            if (preg_match($regex, $text, $m)) {
                $val = $m[1];
                $findings[] = ucfirst($name) . ' value detected: ' . $val;
            }
        }
        return $findings;
    }

    protected function fallbackLocalAnalysis(string $text): string
    {
        // Very lightweight parser for HbA1c and a few labs as a safety net
        $lines = strtolower($text);
        $hba1c = null;
        if (preg_match('/(hba1c|glycated\s*haemoglobin|glyco.?hemoglobin)[^\d]{0,50}(\d+(?:\.\d+)?)\s*%?/i', $text, $m)) {
            $hba1c = (float)$m[2];
        } elseif (preg_match('/\b(\d+(?:\.\d+)?)\s*H\b/i', $text, $m)) {
            $hba1c = (float)$m[1];
        } elseif (preg_match('/\b(\d{1,2}(?:\.\d+)?)\s*%\b/i', $text, $m)) {
            // If a single % value exists on a HbA1c report, use it
            $hba1c = (float)$m[1];
        }

        $parts = ['en' => [], 'si' => [], 'ta' => []];
        if ($hba1c !== null) {
            if ($hba1c < 5.6) {
                $parts['en'][] = 'HbA1c ' . $hba1c . '% is within the normal range for non‑diabetics (<5.6%).';
                $parts['si'][] = 'HbA1c ' . $hba1c . '% සීනි රෝගය නැති අයට සාමාන්‍ය පරාසය තුළට ඇත (<5.6%).';
                $parts['ta'][] = 'HbA1c ' . $hba1c . '% சர்க்கரை நோய் இல்லாதவர்களுக்கு இயல்பான வரம்பிற்குள் உள்ளது (<5.6%).';
            } elseif ($hba1c < 7.0) {
                $parts['en'][] = 'HbA1c ' . $hba1c . '% suggests good glycemic control for people with diabetes (target <7%).';
                $parts['si'][] = 'HbA1c ' . $hba1c . '% සීනි රෝගය ඇති අයට හොඳ ග්ලයිසෙමික් පාලනය පෙන්වනවා (අරමුණ <7%).';
                $parts['ta'][] = 'HbA1c ' . $hba1c . '% சர்க்கரை நோய் உள்ளவர்களுக்கு நல்ல கிளைசெமிக் கட்டுப்பாட்டை பரிந்துரைக்கிறது (இலக்கு <7%).';
            } elseif ($hba1c < 8.0) {
                $parts['en'][] = 'HbA1c ' . $hba1c . '% indicates fair control; consider lifestyle reinforcement and review therapy.';
                $parts['si'][] = 'HbA1c ' . $hba1c . '% සාධාරණ පාලනය පෙන්වනවා; ජීවන රටාව වැඩිදියුණු කරලා ඖෂධ පාලනය බලන්න.';
                $parts['ta'][] = 'HbA1c ' . $hba1c . '% நியாயமான கட்டுப்பாட்டை குறிக்கிறது; வாழ்க்கை முறையை வலுப்படுத்தி சிகிச்சையை மறுபரிசீலனை செய்யவும்.';
            } elseif ($hba1c < 10.0) {
                $parts['en'][] = 'HbA1c ' . $hba1c . '% indicates unsatisfactory control; discuss medication adjustment with your clinician.';
                $parts['si'][] = 'HbA1c ' . $hba1c . '% අපෝෂණීය පාලනය පෙන්වනවා; ඔබේ වෛද්‍යවරයා සමඟ ඖෂධ වෙනස් කිරීම ගැන කථා කරන්න.';
                $parts['ta'][] = 'HbA1c ' . $hba1c . '% திருப்தியற்ற கட்டுப்பாட்டை குறிக்கிறது; உங்கள் மருத்துவருடன் மருந்து சரிசெய்தலை விவாதிக்கவும்.';
            } else {
                $parts['en'][] = 'HbA1c ' . $hba1c . '% indicates very poor control; urgent optimization and close follow‑up are recommended.';
                $parts['si'][] = 'HbA1c ' . $hba1c . '% ඉතාමත් අපෝෂණීය පාලනය පෙන්වනවා; උත්සාහයෙන් පාලනය වැඩිදියුණු කරලා සමීප අනුගමනය අවශ්‍යයි.';
                $parts['ta'][] = 'HbA1c ' . $hba1c . '% மிகவும் மோசமான கட்டுப்பாட்டை குறிக்கிறது; அவசரமாக மேம்படுத்தி நெருக்கமான பின்தொடர்பை பரிந்துரைக்கிறது.';
            }
        }

        // Append simple heuristic findings if any
        $findings = $this->basicLabFindingScan($text);
        if (!empty($findings)) {
            $parts['en'][] = 'Other detected items: ' . implode('; ', $findings) . '.';
            $parts['si'][] = 'වෙනත් හඳුනාගත් අයිතම්: ' . implode('; ', $findings) . '.';
            $parts['ta'][] = 'மற்ற கண்டறியப்பட்ட பொருட்கள்: ' . implode('; ', $findings) . '.';
        }

        if (empty($parts['en'])) {
            $en = 'AI temporarily unavailable. Unable to derive a confident summary from the text.';
            $si = 'AI තාවකාලිකව නැති වුණා. ලිපියෙන් විශ්වාසදායක සාරාංශයක් ලබා ගන්නට නොහැකි වුණා.';
            $ta = 'AI தற்காலிகமாக கிடைக்கவில்லை. உரையில் நம்பகமான சுருக்கத்தை பெற இயலவில்லை.';
        } else {
            $en = 'AI analysis temporarily unavailable due to high demand. Heuristic summary: ' . implode(' ', $parts['en']);
            $si = 'අධික ඉල්ලීම නිසා AI විශ්ලේෂණය තාවකාලිකව නැති වුණා. සරල සාරාංශය: ' . implode(' ', $parts['si']);
            $ta = 'அதிக தேவை காரணமாக AI பகுப்பாய்வு தற்காலிகமாக கிடைக்கவில்லை. எளிய சுருக்கம்: ' . implode(' ', $parts['ta']);
        }
        return "English: $en\nSinhala: $si\nTamil: $ta";
    }
}
