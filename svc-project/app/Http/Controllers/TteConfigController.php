<?php
namespace App\Http\Controllers;

use App\Services\TteConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TteConfigController extends Controller
{
    private const KEYS = ['TTE_BASE_URL', 'TTE_USERNAME', 'TTE_PASSWORD', 'TTE_API_KEY'];

    public function index(Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        $config = TteConfigService::all();
        // Mask password dan api key
        if (isset($config['TTE_PASSWORD'])) $config['TTE_PASSWORD'] = str_repeat('•', strlen($config['TTE_PASSWORD']));
        if (isset($config['TTE_API_KEY']))  $config['TTE_API_KEY']  = str_repeat('•', strlen($config['TTE_API_KEY']));
        return response()->json(['data' => $config]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        $data = $request->validate([
            'TTE_BASE_URL' => 'sometimes|required|url',
            'TTE_USERNAME' => 'sometimes|required|string',
            'TTE_PASSWORD' => 'sometimes|required|string',
            'TTE_API_KEY'  => 'sometimes|required|string',
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, self::KEYS)) {
                TteConfigService::set($key, $value);
            }
        }

        return response()->json(['message' => 'Konfigurasi TTE berhasil disimpan']);
    }

    public function test(Request $request): JsonResponse
    {
        $this->requireRole(['administrator', 'kepala_balai']);
        $baseUrl  = TteConfigService::get('TTE_BASE_URL');
        $username = TteConfigService::get('TTE_USERNAME');
        $password = TteConfigService::get('TTE_PASSWORD');
        $apiKey   = TteConfigService::get('TTE_API_KEY');

        $nik = $request->input('nik', '0000000000000000');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)
                ->withBasicAuth($username, $password)
                ->withHeaders(['x-api-key' => $apiKey])
                ->get("{$baseUrl}/api/user/status/{$nik}");

            return response()->json([
                'data' => [
                    'status'      => $response->status(),
                    'reachable'   => $response->status() !== 0,
                    'response'    => $response->json(),
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => ['reachable' => false, 'error' => $e->getMessage()]
            ]);
        }
    }
}
