import type { NextConfig } from "next";

/**
 * Panggilan API dibuat relatif terhadap origin halaman, lalu diteruskan oleh
 * proses Next.js ini ke gateway dari sisi server.
 *
 * Aplikasi diakses lewat dua jalur: nama domain (wifi kantor) dan IP langsung
 * (VPN). Bila URL API ditanam absolut saat build, satu build hanya cocok untuk
 * salah satunya. Dengan diproksikan di sini, browser selalu memanggil origin
 * yang sama dengan halaman yang sedang dibuka, sehingga satu build melayani
 * kedua jalur sekaligus dan permintaan CORS preflight tidak lagi muncul.
 *
 * API_PROXY_TARGET dipakai bila gateway tidak berada di host yang sama.
 */
const nextConfig: NextConfig = {
  // Next membatasi body permintaan yang diproksikan di 10 MB. Batas dokumen
  // e-Sign adalah 20 MB, jadi nilainya dinaikkan agar unggahan tidak terpotong
  // (svc-storage sendiri menerima hingga post_max_size 30M).
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },

  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
