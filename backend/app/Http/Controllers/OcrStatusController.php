<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OcrStatusController extends Controller
{
    public function status(Request $request)
    {
        $visionSdk = class_exists(\Google\Cloud\Vision\V1\ImageAnnotatorClient::class);
    $visionKey = (string) (config('services.google_vision.key') ?? ''); // from GOOGLE_VISION_API_KEY
        $saPath   = (string) (env('GOOGLE_APPLICATION_CREDENTIALS') ?? '');
        $saOk     = $saPath !== '' && file_exists($saPath);

        $tesseract = $this->hasTesseract();
        $imagick   = class_exists('Imagick');
        $pdfParser = class_exists(\Smalot\PdfParser\Parser::class);

        $openaiKey = (string) (config('services.openai.key') ?? '');
        $openaiModel = (string) (config('services.openai.model') ?? '');

        return response()->json([
            'vision' => [
                'sdk_available' => $visionSdk,
                'api_key_present' => $visionKey !== '',
                'service_account_present' => $saOk,
            ],
            'tesseract_available' => $tesseract,
            'imagick_available' => $imagick,
            'pdf_parser_available' => $pdfParser,
            'openai' => [
                'configured' => $openaiKey !== '',
                'model' => $openaiModel,
            ],
        ]);
    }

    protected function hasTesseract(): bool
    {
        $which = stripos(PHP_OS, 'WIN') === 0 ? 'where' : 'which';
        $output = null; $ret = 1;
        @exec($which . ' tesseract', $output, $ret);
        return $ret === 0;
    }
}
