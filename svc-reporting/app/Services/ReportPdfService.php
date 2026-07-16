<?php
namespace App\Services;

use Illuminate\Http\Response;

class ReportPdfService
{
    private function renderHtml(string $title, string $subtitle, string $content): string
    {
        $date = now()->format('d F Y, H:i');
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
  .header { border-bottom: 2px solid #284074; padding-bottom: 6px; margin-bottom: 8px; }
  .header-text h1 { font-size: 16px; color: #284074; margin: 0 0 2px 0; }
  .header-text p { font-size: 10px; color: #64748b; margin: 0; }
  .meta { font-size: 10px; color: #64748b; margin-bottom: 16px; }
  h2 { font-size: 13px; color: #284074; margin: 16px 0 8px 0; border-left: 3px solid #284074; padding-left: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #284074; color: white; padding: 7px 10px; text-align: left; font-size: 10px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-gray { background: #f1f5f9; color: #475569; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
  .summary-card .num { font-size: 20px; font-weight: bold; color: #284074; }
  .summary-card .lbl { font-size: 9px; color: #64748b; margin-top: 2px; }
  .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div style="float:left;margin-right:8px;width:50px;">
      <img src="__LOGO_BASE64__" style="height:50px;width:auto;" />
    </div>
    <div style="overflow:hidden;padding-top:4px;">
      <h1 style="font-size:16px;color:#284074;margin:0 0 2px 0;">BALAI LAYANAN PENGHUBUNG IDENTITAS DIGITAL</h1>
      <p style="font-size:10px;color:#64748b;margin:0;">Badan Siber dan Sandi Negara</p>
    </div>
    <div style="clear:both;"></div>
  </div>
  <div class="meta">
    <strong>$title</strong> &nbsp;|&nbsp; $subtitle &nbsp;|&nbsp; Dicetak: $date
  </div>
  $content
  <div class="footer">ConnectOne &copy; BLPID BSSN &nbsp;|&nbsp; Dokumen ini digenerate otomatis oleh sistem</div>
</body>
</html>
HTML;
    }

    public function workload(array $data, string $sprintName): Response
    {
        $rows = '';
        foreach ($data as $item) {
            $pct  = $item['total_tasks'] > 0 ? round(($item['completed'] / $item['total_tasks']) * 100) : 0;
            $name = $item['full_name'] ?? $item['user_name'] ?? '-';
            $rows .= "<tr>
                <td>{$name}</td>
                <td>{$item['division']}</td>
                <td style='text-align:center'>{$item['total_tasks']}</td>
                <td style='text-align:center'>{$item['completed']}</td>
                <td style='text-align:center'>{$item['pending']}</td>
                <td style='text-align:center'>{$pct}%</td>
            </tr>";
        }

        $total     = count($data);
        $totalTask = array_sum(array_column($data, 'total_tasks'));
        $totalDone = array_sum(array_column($data, 'completed'));

        $content = "
        <div class='summary-grid'>
            <div class='summary-card'><div class='num'>{$total}</div><div class='lbl'>Total Anggota</div></div>
            <div class='summary-card'><div class='num'>{$totalTask}</div><div class='lbl'>Total Task</div></div>
            <div class='summary-card'><div class='num'>{$totalDone}</div><div class='lbl'>Task Selesai</div></div>
        </div>
        <h2>Detail Workload per Anggota</h2>
        <table>
            <tr><th>Nama</th><th>Divisi</th><th>Total Task</th><th>Selesai</th><th>Pending</th><th>Progress</th></tr>
            {$rows}
        </table>";

        return $this->generate("Laporan Workload", $sprintName, $content);
    }

    public function sprint(array $data, string $sprintName): Response
    {
        $totalTasks   = $data['total_tasks']      ?? 0;
        $doneTasks    = $data['done_tasks']        ?? 0;
        $totalPoints  = $data['total_points']      ?? 0;
        $donePoints   = $data['completed_points']  ?? 0;
        $completion   = $data['completion_rate']   ?? 0;
        $taskPct      = $data['task_completion']   ?? 0;

        $byStatusRows = '';
        foreach ($data['by_status'] ?? [] as $status => $count) {
            $byStatusRows .= "<tr><td>{$status}</td><td style='text-align:center'>{$count}</td></tr>";
        }

        $byTypeRows = '';
        foreach ($data['by_type'] ?? [] as $type => $info) {
            $byTypeRows .= "<tr><td>{$type}</td><td style='text-align:center'>{$info['total']}</td><td style='text-align:center'>{$info['done']}</td></tr>";
        }

        $content = "
        <div class='summary-grid'>
            <div class='summary-card'><div class='num'>{$totalTasks}</div><div class='lbl'>Total Task</div></div>
            <div class='summary-card'><div class='num'>{$doneTasks}</div><div class='lbl'>Task Selesai</div></div>
            <div class='summary-card'><div class='num'>{$taskPct}%</div><div class='lbl'>Task Completion</div></div>
        </div>
        <div class='summary-grid'>
            <div class='summary-card'><div class='num'>{$totalPoints}</div><div class='lbl'>Total Story Points</div></div>
            <div class='summary-card'><div class='num'>{$donePoints}</div><div class='lbl'>Points Selesai</div></div>
            <div class='summary-card'><div class='num'>{$completion}%</div><div class='lbl'>Point Completion</div></div>
        </div>
        <h2>Status Task</h2>
        <table>
            <tr><th>Status</th><th>Jumlah</th></tr>
            {$byStatusRows}
        </table>
        <h2>Tipe Task</h2>
        <table>
            <tr><th>Tipe</th><th>Total</th><th>Selesai</th></tr>
            {$byTypeRows}
        </table>";

        return $this->generate("Laporan Sprint", $sprintName, $content);
    }


    public function velocity(array $data, string $projectName): Response
    {
        $rows = '';
        foreach ($data as $sprint) {
            $pct = $sprint['total_points'] > 0
                ? round(($sprint['completed_points'] / $sprint['total_points']) * 100)
                : 0;
            $statusClass = $sprint['status'] === 'completed' ? 'badge-green' : ($sprint['status'] === 'active' ? 'badge-blue' : 'badge-gray');
            $rows .= "<tr>
                <td>{$sprint['sprint_name']}</td>
                <td><span class='badge {$statusClass}'>{$sprint['status']}</span></td>
                <td style='text-align:center'>{$sprint['total_points']}</td>
                <td style='text-align:center'>{$sprint['completed_points']}</td>
                <td style='text-align:center'>{$pct}%</td>
                <td style='text-align:center'>{$sprint['velocity']}</td>
            </tr>";
        }

        $totalVelocity = array_sum(array_column($data, 'velocity'));
        $avgVelocity   = count($data) > 0 ? round($totalVelocity / count($data), 1) : 0;
        $totalSprints  = count($data);

        $content = "
        <div class='summary-grid'>
            <div class='summary-card'><div class='num'>{$totalSprints}</div><div class='lbl'>Total Sprint</div></div>
            <div class='summary-card'><div class='num'>{$totalVelocity}</div><div class='lbl'>Total Velocity</div></div>
            <div class='summary-card'><div class='num'>{$avgVelocity}</div><div class='lbl'>Rata-rata Velocity</div></div>
        </div>
        <h2>Detail Velocity per Sprint</h2>
        <table>
            <tr><th>Sprint</th><th>Status</th><th>Total Points</th><th>Selesai</th><th>Completion</th><th>Velocity</th></tr>
            {$rows}
        </table>";

        return $this->generate("Laporan Velocity", $projectName, $content);
    }

    public function timeTracking(array $data, string $period): Response
    {
        $rows = '';
        foreach ($data as $item) {
            $rows .= "<tr>
                <td>{$item['full_name']}</td>
                <td>{$item['division']}</td>
                <td style='text-align:center'>{$item['task_count']}</td>
                <td style='text-align:center'>{$item['total_logged']} jam</td>
            </tr>";
        }

        $totalUsers  = count($data);
        $totalHours  = round(array_sum(array_column($data, 'total_logged')), 2);
        $avgHours    = $totalUsers > 0 ? round($totalHours / $totalUsers, 2) : 0;

        $content = "
        <div class='summary-grid'>
            <div class='summary-card'><div class='num'>{$totalUsers}</div><div class='lbl'>Total Anggota</div></div>
            <div class='summary-card'><div class='num'>{$totalHours}</div><div class='lbl'>Total Jam</div></div>
            <div class='summary-card'><div class='num'>{$avgHours}</div><div class='lbl'>Rata-rata Jam/Orang</div></div>
        </div>
        <h2>Detail Time Tracking per Anggota</h2>
        <table>
            <tr><th>Nama</th><th>Divisi</th><th>Jumlah Task</th><th>Total Jam</th></tr>
            {$rows}
        </table>";

        return $this->generate("Laporan Time Tracking", $period, $content);
    }
    private function generate(string $title, string $subtitle, string $content): Response
    {
        // Embed logo sebagai base64
        $logoPath = storage_path('app/logo_blpid.png');
        $logoB64  = '';
        if (file_exists($logoPath)) {
            $logoB64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }
        $html = str_replace('__LOGO_BASE64__', $logoB64, $this->renderHtml($title, $subtitle, $content));
        $pdf  = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $filename = strtolower(str_replace(' ', '_', $title)) . '_' . now()->format('Ymd_His') . '.pdf';
        return $pdf->download($filename);
    }
}
