#!/usr/bin/env bash
# Uji tiga perubahan: pelaksana CR ditetapkan penilai, pembuat e-Sign bukan
# otomatis penanda tangan pertama, dan penambahan anggota proyek per grup.
set -u
GW=http://localhost:8000
PASS='UatCheck#2026'
SP=$(dirname "$0")/.tmp
mkdir -p "$SP"

login() {  # $1 = email prefix
  curl -s -X POST $GW/api/v1/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1@test.com\",\"password\":\"$PASS\"}" |
    python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('access_token') or '')"
}
uid() { curl -s -H "Authorization: Bearer $1" $GW/api/v1/auth/me |
  python3 -c "import sys,json;d=json.load(sys.stdin);a=d.get('data',d);print(a.get('id',''))"; }
code() { echo "$1" | python3 -c "import sys;print(sys.stdin.read().strip())"; }
ok()   { printf '  \033[32mOK   \033[0m %s\n' "$1"; }
bad()  { printf '  \033[31mGAGAL\033[0m %s\n' "$1"; FAIL=1; }
FAIL=0

echo "== login akun uji =="
PO=$(login po);   sleep 8
PM=$(login pm);   sleep 8
SM=$(login sm);   sleep 8
STAFF=$(login staff)
PO_ID=$(uid "$PO"); PM_ID=$(uid "$PM"); SM_ID=$(uid "$SM"); STAFF_ID=$(uid "$STAFF")
echo "  po=${PO_ID:0:8} pm=${PM_ID:0:8} sm=${SM_ID:0:8} staff=${STAFF_ID:0:8}"

echo
echo "== 1. Pelaksana CR ditetapkan oleh penilai =="
CR=$(curl -s -X POST $GW/api/v1/change-requests -H "Authorization: Bearer $PO" \
  -H 'Content-Type: application/json' -d "{
    \"title\":\"Uji pelaksana oleh penilai\",\"description\":\"d\",\"reason\":\"r\",
    \"priority\":\"medium\",\"change_type\":\"normal\",
    \"reviewer_ids\":[\"$PM_ID\",\"$SM_ID\"],\"signer_id\":\"$PO_ID\"}" |
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('id',''))")
[ -n "$CR" ] && ok "CR dibuat tanpa field pelaksana ($CR)" || { bad "CR gagal dibuat"; exit 1; }

PEL=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/change-requests/$CR |
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('pelaksana_ids'))")
[ "$PEL" = "None" ] || [ "$PEL" = "[]" ] && ok "pelaksana masih kosong setelah dibuat" || bad "pelaksana terisi saat pembuatan: $PEL"

# sebelum submit: belum boleh ditetapkan
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST $GW/api/v1/change-requests/$CR/implementers \
  -H "Authorization: Bearer $PM" -H 'Content-Type: application/json' -d "{\"pelaksana_ids\":[\"$STAFF_ID\"]}")
[ "$C" = "422" ] && ok "status draft ditolak (422)" || bad "status draft seharusnya 422, dapat $C"

curl -s -o /dev/null -X POST $GW/api/v1/change-requests/$CR/submit -H "Authorization: Bearer $PO"

# bukan penilai
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST $GW/api/v1/change-requests/$CR/implementers \
  -H "Authorization: Bearer $STAFF" -H 'Content-Type: application/json' -d "{\"pelaksana_ids\":[\"$STAFF_ID\"]}")
[ "$C" = "403" ] && ok "bukan penilai ditolak (403)" || bad "non-penilai seharusnya 403, dapat $C"

# penilai 1 menetapkan
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST $GW/api/v1/change-requests/$CR/implementers \
  -H "Authorization: Bearer $PM" -H 'Content-Type: application/json' -d "{\"pelaksana_ids\":[\"$STAFF_ID\"]}")
[ "$C" = "200" ] && ok "penilai 1 berhasil menetapkan pelaksana" || bad "penilai 1 gagal, dapat $C"

# penilai 2 tidak boleh menimpa
C=$(curl -s -o /dev/null -w '%{http_code}' -X POST $GW/api/v1/change-requests/$CR/implementers \
  -H "Authorization: Bearer $SM" -H 'Content-Type: application/json' -d "{\"pelaksana_ids\":[\"$PO_ID\"]}")
[ "$C" = "422" ] && ok "penilai 2 terkunci setelah penilai 1 mengisi (422)" || bad "penilai 2 seharusnya 422, dapat $C"

SETBY=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/change-requests/$CR |
  python3 -c "import sys,json;d=json.load(sys.stdin);a=d.get('data',{});print(a.get('pelaksana_set_by',''),a.get('pelaksana_ids'))")
echo "     tercatat: $SETBY"

echo
echo "== 2. Pembuat e-Sign tidak otomatis jadi penanda tangan =="
PDF=$(mktemp /tmp/uji_XXXX.pdf); printf '%%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF' > "$PDF"
REQ=$(curl -s -X POST $GW/api/v1/tte-sign-requests -H "Authorization: Bearer $PO" \
  -F "title=Uji urutan penandatangan" -F "file=@$PDF;type=application/pdf" \
  -F "signer_ids[]=$PM_ID" -F "signer_ids[]=$SM_ID" |
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('data',{}).get('id',''))")
if [ -n "$REQ" ]; then
  SIGNERS=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/tte-sign-requests/$REQ |
    python3 -c "
import sys,json
d=json.load(sys.stdin).get('data',{})
s=d.get('signers',[])
print(';'.join(f\"{x.get('order')}:{(x.get('user') or {}).get('id','?')[:8]}\" for x in s))")
  echo "     urutan penandatangan: $SIGNERS"
  echo "$SIGNERS" | grep -q "${PO_ID:0:8}" && bad "pembuat masih ikut jadi penandatangan" || ok "pembuat tidak ikut karena tidak memilih dirinya"
  echo "$SIGNERS" | grep -q "1:${PM_ID:0:8}" && ok "penandatangan urutan 1 = pilihan pertama pembuat" || bad "urutan 1 bukan pilihan pertama"
else
  bad "permintaan e-Sign gagal dibuat"
fi
rm -f "$PDF"

echo
echo "== 3. Tambah anggota proyek lewat grup =="
GRP=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/user-groups |
  python3 -c "
import sys,json;d=json.load(sys.stdin).get('data',[])
g=[x for x in d if (x.get('member_count') or 0)>0]
print(g[0]['id'] if g else '')")
PROJ=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/projects |
  python3 -c "import sys,json;d=json.load(sys.stdin).get('data',[]);print(d[0]['id'] if d else '')")
if [ -n "$GRP" ] && [ -n "$PROJ" ]; then
  GN=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/user-groups/$GRP |
    python3 -c "import sys,json;d=json.load(sys.stdin).get('data',{});print(len(d.get('members',[])))")
  BEFORE=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/projects/$PROJ/members |
    python3 -c "import sys,json;print(len(json.load(sys.stdin).get('data',[])))")
  RES=$(curl -s -X POST $GW/api/v1/projects/$PROJ/members -H "Authorization: Bearer $PO" \
    -H 'Content-Type: application/json' -d "{\"group_ids\":[\"$GRP\"],\"role\":\"member\"}")
  ADDED=$(echo "$RES" | python3 -c "import sys,json;print(json.load(sys.stdin).get('added','?'))" 2>/dev/null)
  AFTER=$(curl -s -H "Authorization: Bearer $PO" $GW/api/v1/projects/$PROJ/members |
    python3 -c "import sys,json;print(len(json.load(sys.stdin).get('data',[])))")
  echo "     grup berisi $GN anggota; proyek $BEFORE -> $AFTER (added=$ADDED)"
  [ "$ADDED" = "$GN" ] && ok "seluruh anggota grup didaftarkan sebagai anggota proyek" || bad "jumlah tidak cocok (added=$ADDED, grup=$GN)"
  [ "$AFTER" -ge "$BEFORE" ] && ok "daftar anggota proyek bertambah/tetap (tanpa duplikat)" || bad "anggota proyek berkurang"
else
  echo "     dilewati: butuh minimal 1 grup berisi anggota dan 1 proyek"
fi

echo
[ "$FAIL" = "0" ] && echo "SEMUA PEMERIKSAAN LULUS" || echo "ADA PEMERIKSAAN YANG GAGAL"
exit $FAIL
