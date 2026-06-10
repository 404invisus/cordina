<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class SendNotificationRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'user_id' => 'required|string',
            'type'    => 'required|string',
            'payload' => 'nullable|array',
        ];
    }
}
