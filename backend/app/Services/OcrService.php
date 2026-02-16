<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OcrService
{
    public function extract(string $fullPath, string $mime): string
    {
        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        Log::info("[OcrService] Extracting text from $fullPath ext=$ext mime=$mime");
        
        // Try Google Vision if configured
        $serviceAccountPath = env('GOOGLE_APPLICATION_CREDENTIALS');
        if ($serviceAccountPath && file_exists($serviceAccountPath)) {
            putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $serviceAccountPath);
        }
        $apiKey = config('services.google_vision.key') ?: env('GOOGLE_VISION_API_KEY');
        $hasVision = ($apiKey && $apiKey !== '') || ($serviceAccountPath && file_exists($serviceAccountPath));

        if ($hasVision) {
            // Images via Vision
            if (in_array($ext, ['jpg','jpeg','png','webp'])) {
                $text = $this->googleVisionTextDetection($fullPath, (string)($apiKey ?? ''));
                if ($text) return trim($text);
            }
            // PDFs: attempt first few pages
            if ($ext === 'pdf' && $this->hasImageMagick()) {
                $aggregated = [];
                for ($p = 0; $p < 3; $p++) {
                    $pageImg = $this->pdfPageToPng($fullPath, $p);
                    if (!$pageImg) break;
                    $pText = $this->googleVisionTextDetection($pageImg, (string)($apiKey ?? ''));
                    if ($pText) $aggregated[] = $pText;
                }
                if (!empty($aggregated)) return trim(implode("\n\n", $aggregated));
            }
        }

        // Simple PDF text extraction attempt (if parser installed)
        if ($ext === 'pdf' && class_exists(\Smalot\PdfParser\Parser::class)) {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($fullPath);
                $text = $pdf->getText();
                if (trim($text) !== '') {
                    return trim($text);
                }
            } catch (\Throwable $e) {
                Log::warning('[OcrService] PDF parser failed: ' . $e->getMessage());
            }
        }

        // Tesseract fallback if available
        if ($this->hasTesseract()) {
            $imageForOcr = $fullPath;
            if ($ext === 'pdf' && $this->hasImageMagick()) {
                $img = $this->pdfFirstPageToPng($fullPath);
                if ($img) $imageForOcr = $img;
            }
            $text = $this->tesseractOcr($imageForOcr);
            if (trim($text) !== '') return trim($text);
        }

        return '';
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

    protected function pdfFirstPageToPng(string $pdfPath): ?string
    {
        try {
            $tmp = storage_path('app/tmp_' . Str::uuid() . '.png');
            $cmd = 'magick convert "' . $pdfPath . '[0]" "' . $tmp . '"';
            $output = null; $ret = 1;
            @exec($cmd, $output, $ret);
            if ($ret === 0 && file_exists($tmp)) return $tmp;
        } catch (\Throwable $e) {
            Log::info('[OcrService] pdfFirstPageToPng failed: ' . $e->getMessage());
        }
        return null;
    }

    protected function tesseractOcr(string $imagePath): string
    {
        $outBase = storage_path('app/tmp_ocr_' . Str::uuid());
        $cmd = 'tesseract ' . escapeshellarg($imagePath) . ' ' . escapeshellarg($outBase) . ' 2>&1';
        @exec($cmd, $output, $ret);
        if ($ret !== 0) {
            Log::info('[OcrService] Tesseract failed: ' . implode("\n", $output));
            return '';
        }
        $txt = $outBase . '.txt';
        return file_exists($txt) ? trim(file_get_contents($txt)) : '';
    }

    protected function pdfPageToPng(string $pdfPath, int $page): ?string
    {
        try {
            $tmp = storage_path('app/tmp_' . Str::uuid() . '.png');
            $cmd = 'magick convert "' . $pdfPath . '[' . $page . ']" "' . $tmp . '"';
            $output = null; $ret = 1;
            @exec($cmd, $output, $ret);
            if ($ret === 0 && file_exists($tmp)) return $tmp;
        } catch (\Throwable $e) {
            return null;
        }
        return null;
    }

    protected function googleVisionTextDetection(string $imagePath, string $apiKey): ?string
    {
        // Prefer SDK
        if (class_exists(\Google\Cloud\Vision\V1\ImageAnnotatorClient::class)) {
            try {
                putenv('GOOGLE_API_KEY=' . $apiKey);
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
                Log::warning('[OcrService] Vision SDK failed: ' . $e->getMessage());
            }
        }

        // REST fallback
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
                return $text ? trim($text) : null;
            }
        } catch (\Throwable $e) {
            Log::warning('[OcrService] Vision REST failed: ' . $e->getMessage());
        }
        return null;
    }

    public function extractNicNumber(string $text): ?string
    {
        // NIC pattern examples (Sri Lanka old/new): 9 digits + letter OR 12 digits
        if (preg_match('/\b(\d{9}[VvXx])\b/', $text, $m)) return strtoupper($m[1]);
        if (preg_match('/\b(\d{12})\b/', $text, $m)) return $m[1];
        return null;
    }
}
