<?php
namespace App\Services;

use App\Models\ChangeRequest;

class CrPdfService
{
    public function generate(ChangeRequest $cr, array $requester, array $signer, array $reviewers, array $pelaksana): string
    {
        $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('ConnectOne');
        $pdf->SetAuthor('BLPID BSSN');
        $pdf->SetTitle('Form RFC - ' . $cr->title);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(20, 20, 20);
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();
        $pdf->SetFont('helvetica', '', 9);

        // ── Header ──
        $logoPath = base_path('../ui-web/public/logo_blpid.png');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 20, 15, 35, 0, 'PNG');
        }

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->SetXY(60, 15);
        $pdf->Cell(0, 6, 'BALAI LAYANAN PENGHUBUNG IDENTITAS DIGITAL', 0, 1, 'L');
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetX(60);
        $pdf->Cell(0, 5, 'Badan Siber dan Sandi Negara', 0, 1, 'L');

        // Tabel info formulir kanan atas
        $pdf->SetXY(130, 15);
        $pdf->SetFont('helvetica', '', 8);
        $infoW1 = 35; $infoW2 = 45;
        $rows = [
            ['No. Formulir', 'Form.02/BP/03/2025'],
            ['No. Tiket', ''],
            ['No. Revisi', '01'],
            ['Tanggal', now()->format('d M Y')],
        ];
        foreach ($rows as $row) {
            $pdf->SetX(130);
            $pdf->Cell($infoW1, 5, $row[0], 1, 0, 'L');
            $pdf->Cell($infoW2, 5, $row[1], 1, 1, 'L');
        }

        $pdf->Ln(5);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 8, 'PERMOHONAN PERUBAHAN (REQUEST FOR CHANGE)', 0, 1, 'C');
        $pdf->SetFont('helvetica', '', 9);
        $pdf->Cell(0, 5, 'Tanggal Permohonan : ' . ($cr->created_at ? $cr->created_at->format('d F Y') : '-'), 0, 1, 'L');
        $pdf->Ln(2);

        $w1 = 50; $w2 = 120;

        // ── Fungsi helper ──
        $section = function(string $title) use ($pdf) {
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetFillColor(41, 65, 116);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->Cell(0, 6, '  ' . $title, 0, 1, 'L', true);
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', '', 9);
        };

        $row = function(string $label, string $value) use ($pdf, $w1, $w2) {
            $pdf->SetFont('helvetica', 'B', 9);
            $h = max(6, $pdf->getStringHeight($w2, $value) + 2);
            $x = $pdf->GetX(); $y = $pdf->GetY();
            $pdf->MultiCell($w1, $h, $label, 1, 'L', false, 0, $x, $y);
            $pdf->SetFont('helvetica', '', 9);
            $pdf->MultiCell($w2, $h, $value ?: '-', 1, 'L', false, 1, $x + $w1, $y);
        };

        // ── Informasi Personil ──
        $section('INFORMASI PERSONIL');
        $row('Pemohon', $requester['full_name'] ?? '-');
        $row('Pelaksana', implode(', ', array_column($pelaksana, 'full_name')) ?: '-');
        $row('Unit Kerja', 'Balai Layanan Penghubung Identitas Digital');
        $pdf->Ln(2);

        // ── Informasi Perubahan ──
        $section('INFORMASI PERUBAHAN');
        $row('Jenis Perubahan', ucfirst($cr->change_type ?? '-'));
        $row('Perubahan yang Diajukan', $cr->description ?? '-');
        $row('Rincian', $cr->rincian ?? '-');
        $row('Latar Belakang / Alasan', $cr->reason ?? '-');
        $row('Rencana Waktu Perubahan', $cr->rencana_waktu ? $cr->rencana_waktu->format('d F Y') : '-');
        $row('Dependensi Layanan', $cr->dependensi_layanan ?? '-');
        $row('SI yang Terdampak', $cr->si_terdampak ?? '-');
        $pdf->Ln(2);

        // ── Analisis Risiko ──
        $section('ANALISIS RISIKO');
        $row('Analisis/Kajian Risiko', $cr->impact ?? '-');
        $row('Langkah Mitigasi Risiko', $cr->langkah_mitigasi ?? '-');
        $row('Risiko Apabila Tidak Dilakukan', $cr->risiko_tidak_dilakukan ?? '-');
        $row('Langkah Penanganan Kegagalan', $cr->langkah_penanganan_kegagalan ?? '-');
        $pdf->Ln(2);

        // ── Tanda Tangan ──
        $section('TANDA TANGAN');
        $pdf->Ln(2);

        $colW = ($w1 + $w2) / 3;
        $pdf->SetFont('helvetica', 'B', 9);
        $pdf->Cell($colW, 6, 'Dibuat Oleh', 1, 0, 'C');
        $pdf->Cell($colW, 6, 'Telah Diperiksa Oleh', 1, 0, 'C');
        $pdf->Cell($colW, 6, 'Disetujui Oleh', 1, 1, 'C');

        $pdf->SetFont('helvetica', '', 8);
        // Row nama penilai
        $reviewerNames = implode(', ', array_column($reviewers, 'full_name'));
        $pdf->Cell($colW, 5, $requester['full_name'] ?? '-', 1, 0, 'C');
        $pdf->Cell($colW, 5, $reviewerNames ?: '-', 1, 0, 'C');
        $pdf->Cell($colW, 5, $signer['full_name'] ?? '-', 1, 1, 'C');

        // Row spesimen & spasi TTD
        $ttdH = 30;
        $xStart = $pdf->GetX();
        $yStart = $pdf->GetY();

        // Kolom dibuat oleh - kosong
        $pdf->Cell($colW, $ttdH, '', 1, 0, 'C');
        // Kolom diperiksa - kosong
        $pdf->Cell($colW, $ttdH, '', 1, 0, 'C');
        // Kolom disetujui - placeholder spesimen TTE
        $pdf->Cell($colW, $ttdH, '', 1, 1, 'C');

        // Tambah marker $ sebagai anchor posisi TTE
        $pdf->SetFont('helvetica', 'B', 24);
        $pdf->SetTextColor(255, 255, 255); // invisible (putih)
        $pdf->SetXY($xStart + ($colW * 2) + ($colW / 2) - 5, $yStart + ($ttdH / 2) - 8);
        $pdf->Cell(10, 10, '$', 0, 1, 'C');
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetFont('helvetica', 'I', 7);
        $pdf->SetXY($xStart + ($colW * 2) + 2, $yStart + $ttdH - 5);
        $pdf->Cell($colW - 4, 5, '[Tanda Tangan Elektronik]', 0, 1, 'C');

        return $pdf->Output('cr_' . $cr->id . '.pdf', 'S');
    }
}
