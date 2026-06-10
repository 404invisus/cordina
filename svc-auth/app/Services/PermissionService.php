<?php
namespace App\Services;

use App\Models\UserExtraPermission;

class PermissionService
{
    const ROLE_PERMISSIONS = [
        'kepala_balai' => [
            'project.create', 'project.edit', 'project.delete', 'project.manage_members',
            'sprint.manage', 'sprint.view',
            'task.create', 'task.edit_own', 'task.edit_all', 'task.assign', 'task.delete', 'task.log_time',
            'cr.submit', 'cr.approve',
            'calendar.view', 'calendar.create_own', 'calendar.manage',
            'user.manage',
            'report.view', 'report.export',
            'attendance.clock', 'attendance.view_own', 'attendance.view_all',
            'asset.view', 'asset.manage',
            'document.view', 'document.manage',
            'notification.manage',
        ],
        'kepala_seksi' => [
            'project.edit', 'project.manage_members',
            'sprint.manage', 'sprint.view',
            'task.create', 'task.edit_own', 'task.edit_all', 'task.assign', 'task.delete', 'task.log_time',
            'cr.submit', 'cr.approve',
            'calendar.view', 'calendar.create_own', 'calendar.manage',
            'report.view', 'report.export',
            'attendance.clock', 'attendance.view_own', 'attendance.view_all',
            'asset.view', 'asset.manage',
            'document.view', 'document.manage',
        ],
        'project_manager' => [
            'project.edit', 'project.manage_members',
            'sprint.manage', 'sprint.view',
            'task.create', 'task.edit_own', 'task.edit_all', 'task.assign', 'task.delete', 'task.log_time',
            'cr.submit',
            'calendar.view', 'calendar.create_own',
            'report.view', 'report.export',
            'attendance.clock', 'attendance.view_own',
            'asset.view', 'asset.manage',
            'document.view', 'document.manage',
        ],
        'scrum_master' => [
            'sprint.manage', 'sprint.view',
            'task.create', 'task.edit_own', 'task.edit_all', 'task.assign', 'task.log_time',
            'cr.submit',
            'calendar.view', 'calendar.create_own',
            'report.view',
            'attendance.clock', 'attendance.view_own',
            'asset.view',
            'document.view',
        ],
        'staff' => [
            'sprint.view',
            'task.edit_own', 'task.log_time',
            'cr.submit',
            'calendar.view', 'calendar.create_own',
            'attendance.clock', 'attendance.view_own',
            'asset.view',
            'document.view',
        ],
        'administrator' => [
            'project.create', 'project.edit', 'project.delete', 'project.manage_members',
            'sprint.manage', 'sprint.view',
            'task.create', 'task.edit_own', 'task.edit_all', 'task.assign', 'task.delete', 'task.log_time',
            'cr.submit', 'cr.approve',
            'calendar.view', 'calendar.create_own', 'calendar.manage',
            'user.manage',
            'report.view', 'report.export',
            'attendance.clock', 'attendance.view_own', 'attendance.view_all',
            'asset.view', 'asset.manage',
            'document.view', 'document.manage',
            'notification.manage',
        ],
    ];

    const ALL_PERMISSIONS = [
        // Project
        'project.create'        => 'Membuat project baru',
        'project.edit'          => 'Mengedit project (nama, deskripsi, status)',
        'project.delete'        => 'Menghapus project',
        'project.manage_members'=> 'Tambah/hapus anggota project',
        // Sprint
        'sprint.manage'         => 'Buat, mulai, selesaikan sprint',
        'sprint.view'           => 'Lihat detail sprint dan backlog',
        // Task
        'task.create'           => 'Membuat task baru',
        'task.edit_own'         => 'Edit task milik sendiri',
        'task.edit_all'         => 'Edit task milik siapapun',
        'task.assign'           => 'Assign task ke anggota',
        'task.delete'           => 'Hapus task',
        'task.log_time'         => 'Log waktu pengerjaan',
        // Change Management
        'cr.submit'             => 'Mengajukan Change Request',
        'cr.approve'            => 'Menyetujui/menolak Change Request',
        // Calendar
        'calendar.view'         => 'Lihat kalender',
        'calendar.create_own'   => 'Buat event untuk diri sendiri',
        'calendar.manage'       => 'Buat/edit event untuk semua user',
        // User
        'user.manage'           => 'Kelola user, role, dan privilege',
        // Report
        'report.view'           => 'Lihat laporan analitik',
        'report.export'         => 'Export laporan ke file',
        // Attendance
        'attendance.clock'      => 'Clock-in/out absensi',
        'attendance.view_own'   => 'Lihat absensi sendiri',
        'attendance.view_all'   => 'Lihat absensi semua pegawai',
        // Asset
        'asset.view'            => 'Lihat daftar aset',
        'asset.manage'          => 'Tambah/edit/hapus aset',
        // Document
        'document.view'         => 'Lihat dokumen',
        'document.manage'       => 'Tambah/edit/hapus dokumen',
        // Notification
        'notification.manage'   => 'Kelola konfigurasi notifikasi Telegram',
    ];

    public function getUserPermissions(string $userId, array $roles): array
    {
        $defaultPerms = [];
        foreach ($roles as $role) {
            $defaultPerms = array_merge($defaultPerms, self::ROLE_PERMISSIONS[$role] ?? []);
        }
        $defaultPerms = array_unique($defaultPerms);

        $extras  = UserExtraPermission::where('user_id', $userId)->get();
        $granted = $extras->where('granted', true)->pluck('permission')->toArray();
        $revoked = $extras->where('granted', false)->pluck('permission')->toArray();

        $final = array_unique(array_merge($defaultPerms, $granted));
        $final = array_values(array_diff($final, $revoked));

        return $final;
    }

    public function hasPermission(string $userId, array $roles, string $permission): bool
    {
        return in_array($permission, $this->getUserPermissions($userId, $roles));
    }

    public function setPermission(string $userId, string $permission, bool $granted, string $grantedBy): void
    {
        UserExtraPermission::updateOrCreate(
            ['user_id' => $userId, 'permission' => $permission],
            ['granted' => $granted, 'granted_by' => $grantedBy]
        );
    }

    public function resetPermissions(string $userId): void
    {
        UserExtraPermission::where('user_id', $userId)->delete();
    }
}
