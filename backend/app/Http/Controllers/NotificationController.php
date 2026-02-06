<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'recipient_type' => 'required|in:student,teacher,department',
            'recipient_id' => 'required|integer',
            'status' => 'nullable|in:unread,all',
            'limit' => 'nullable|integer|min:1|max:100',
            'cursor' => 'nullable|string',
        ]);

        $query = Notification::where('recipient_type', $data['recipient_type'])
            ->where('recipient_id', (int) $data['recipient_id'])
            ->orderByDesc('created_at');

        if (($data['status'] ?? null) === 'unread') {
            $query->whereNull('read_at');
        }

        $limit = (int) ($data['limit'] ?? 20);
        $notifications = $query->paginate($limit);

        return response()->json([
            'success' => true,
            'notifications' => $notifications->items(),
            'next_cursor' => $notifications->nextPageUrl(),
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        $data = $request->validate([
            'recipient_type' => 'required|in:student,teacher,department',
            'recipient_id' => 'required|integer',
        ]);

        if ($notification->recipient_type !== $data['recipient_type'] || (int) $notification->recipient_id !== (int) $data['recipient_id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['success' => true, 'notification' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $data = $request->validate([
            'recipient_type' => 'required|in:student,teacher,department',
            'recipient_id' => 'required|integer',
        ]);

        Notification::where('recipient_type', $data['recipient_type'])
            ->where('recipient_id', (int) $data['recipient_id'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
