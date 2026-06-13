# 11 — Domain Glossary

> **AI Instruction:** Gunakan terminologi ini secara konsisten dalam kode, UI label, komentar, dan dokumentasi. Kesalahan istilah maritim adalah kesalahan profesional yang merusak kredibilitas sistem.

---

## 11.1 Istilah Kapal (Vessel)

| Istilah Inggris      | Istilah Indonesia (UI) | Kode (variabel/enum) | Catatan                                    |
| -------------------- | ---------------------- | -------------------- | ------------------------------------------ |
| Vessel               | Kapal                  | `vessel`             | Jangan "ship" untuk formal ERP             |
| Ship                 | Kapal                  | `vessel`             | Sama dengan vessel, gunakan vessel di kode |
| Fleet                | Armada                 | `fleet`              | Kumpulan kapal satu perusahaan             |
| IMO Number           | Nomor IMO              | `imoNumber`          | 7 digit, unik global                       |
| MMSI Number          | Nomor MMSI             | `mmsiNumber`         | 9 digit, untuk AIS                         |
| Call Sign            | Tanda Panggil          | `callSign`           | Radio identifier                           |
| Flag State           | Negara Bendera         | `flagState`          | Negara registrasi kapal                    |
| Port of Registry     | Pelabuhan Pendaftaran  | `portOfRegistry`     |                                            |
| Gross Tonnage        | Gross Tonnage          | `grossTonnage`       | Disingkat GT, bukan "berat"                |
| Net Tonnage          | Net Tonnage            | `netTonnage`         | Disingkat NT                               |
| Deadweight Tonnage   | Deadweight Tonnage     | `deadweightTonnage`  | Disingkat DWT                              |
| LOA (Length Overall) | Panjang Keseluruhan    | `lengthOverall`      | Dalam meter                                |
| Breadth              | Lebar                  | `breadth`            | Dalam meter                                |
| Depth                | Dalam                  | `depth`              | Dalam meter                                |
| Draft                | Sarat                  | `draft`              | Kedalaman kapal di air                     |
| Class Society        | Biro Klasifikasi       | `classSociety`       | BKI, DNV, Lloyd's, ABS, NK                 |
| Class Number         | Nomor Kelas            | `classNumber`        |                                            |
| Shipyard             | Galangan Kapal         | `shipyard`           |                                            |
| Year Built           | Tahun Pembangunan      | `yearBuilt`          |                                            |

### Tipe Kapal (VesselType Enum)

| Enum              | Nama Lengkap           | UI Label              |
| ----------------- | ---------------------- | --------------------- |
| `BULK_CARRIER`    | Bulk Carrier           | Kapal Curah           |
| `TANKER_CRUDE`    | Crude Oil Tanker       | Tanker Minyak Mentah  |
| `TANKER_PRODUCT`  | Product Tanker         | Tanker Produk         |
| `TANKER_CHEMICAL` | Chemical Tanker        | Tanker Kimia          |
| `CONTAINER`       | Container Vessel       | Kapal Kontainer       |
| `GENERAL_CARGO`   | General Cargo          | Kapal Kargo Umum      |
| `RO_RO`           | Roll-on/Roll-off       | Kapal Ro-Ro           |
| `PASSENGER`       | Passenger Vessel       | Kapal Penumpang       |
| `OFFSHORE_SUPPLY` | Offshore Supply Vessel | Kapal Supply Offshore |
| `TUGBOAT`         | Tugboat                | Kapal Tunda           |
| `BARGE`           | Barge                  | Tongkang/Ponton       |
| `LNG_CARRIER`     | LNG Carrier            | Kapal LNG             |

### Status Kapal (VesselStatus Enum)

| Enum       | UI Label       | Warna     | Keterangan                         |
| ---------- | -------------- | --------- | ---------------------------------- |
| `ACTIVE`   | Beroperasi     | Hijau     | Kapal sedang aktif berlayar        |
| `DRYDOCK`  | Dok Kering     | Kuning    | Sedang di galangan untuk perbaikan |
| `LAID_UP`  | Diistirahatkan | Abu-abu   | Tidak beroperasi sementara         |
| `SCRAPPED` | Dibesituakan   | Merah tua | Kapal sudah tidak ada              |
| `SOLD`     | Dijual         | Biru      | Sudah berpindah kepemilikan        |

---

## 11.2 Istilah Kru (Crew)

| Istilah Inggris     | Istilah Indonesia (UI)  | Kode                 | Catatan                           |
| ------------------- | ----------------------- | -------------------- | --------------------------------- |
| Seafarer            | Pelaut                  | `seafarer`           | Istilah resmi IMO                 |
| Crew                | Kru / Awak Kapal        | `crew`               | Kolektif                          |
| Manning             | Manning / Pemenuhan Kru | `manning`            |                                   |
| Sign-on             | Naik Kapal              | `signOn`             | Mulai kontrak di atas kapal       |
| Sign-off            | Turun Kapal             | `signOff`            | Akhir kontrak, meninggalkan kapal |
| On Board            | Di Atas Kapal           | `onBoard`            |                                   |
| Seaman Book         | Buku Pelaut             | `seamanBook`         | Dokumen identitas pelaut          |
| Contract            | Kontrak                 | `contract`           | Perjanjian kerja laut (PKL)       |
| Manning Period      | Periode Manning         | `manningPeriod`      | Durasi kontrak                    |
| Rotation            | Rotasi                  | `rotation`           | Pergantian kru                    |
| Relief              | Pengganti               | `relief`             | Kru pengganti                     |
| Joining Port        | Pelabuhan Naik          | `joiningPort`        |                                   |
| Disembarkation Port | Pelabuhan Turun         | `disembarkationPort` |                                   |

### Jabatan Kru (CrewRank Enum)

| Enum              | Jabatan Indonesia  | Singkatan     | Departemen    |
| ----------------- | ------------------ | ------------- | ------------- |
| `MASTER`          | Nakhoda            | Master / Capt | Deck          |
| `CHIEF_OFFICER`   | Mualim I           | C/O           | Deck          |
| `SECOND_OFFICER`  | Mualim II          | 2/O           | Deck          |
| `THIRD_OFFICER`   | Mualim III         | 3/O           | Deck          |
| `CHIEF_ENGINEER`  | Kepala Kamar Mesin | C/E           | Engine        |
| `SECOND_ENGINEER` | Masinis II         | 2/E           | Engine        |
| `THIRD_ENGINEER`  | Masinis III        | 3/E           | Engine        |
| `FOURTH_ENGINEER` | Masinis IV         | 4/E           | Engine        |
| `BOSUN`           | Serang             | Bosun         | Deck Rating   |
| `ABLE_SEAMAN`     | Kelasi I / AB      | AB            | Deck Rating   |
| `ORDINARY_SEAMAN` | Kelasi II / OS     | OS            | Deck Rating   |
| `FITTER`          | Fitter             | Fitter        | Engine Rating |
| `OILER`           | Juru Minyak        | Oiler         | Engine Rating |
| `WIPER`           | Wiper              | Wiper         | Engine Rating |
| `CHIEF_COOK`      | Juru Masak Kepala  | Cook          | Catering      |
| `MESSMAN`         | Pelayan            | Messman       | Catering      |
| `ELECTRICIAN`     | Juru Listrik       | Elec          | Technical     |
| `RADIO_OFFICER`   | Perwira Radio      | R/O           | Communication |

---

## 11.3 Istilah Sertifikasi (Certificates)

### Sertifikat Kapal

| Singkatan | Nama Lengkap                                       | Regulasi        |
| --------- | -------------------------------------------------- | --------------- |
| SMC       | Safety Management Certificate                      | ISM Code        |
| DOC       | Document of Compliance                             | ISM Code        |
| ISSC      | International Ship Security Certificate            | ISPS Code       |
| ITC       | International Tonnage Certificate                  | SOLAS           |
| IAPP      | International Air Pollution Prevention Certificate | MARPOL Annex VI |
| IOPP      | International Oil Pollution Prevention Certificate | MARPOL Annex I  |
| CSR       | Continuous Synopsis Record                         | SOLAS           |
| MLC       | Maritime Labour Certificate                        | MLC 2006        |
| LSMC      | Load Safety Management Certificate                 | SOLAS           |

### Sertifikat Pelaut (STCW)

| Singkatan | Nama Lengkap                             | Peraturan             |
| --------- | ---------------------------------------- | --------------------- |
| CoC       | Certificate of Competency                | STCW Reg. II/1, III/1 |
| CoP       | Certificate of Proficiency               | STCW                  |
| BST       | Basic Safety Training                    | STCW Reg. VI/1        |
| SCRFA     | Survival Craft & Rescue Boat             | STCW Reg. VI/2        |
| AFF       | Advanced Fire Fighting                   | STCW Reg. VI/3        |
| MEFA      | Medical First Aid                        | STCW Reg. VI/4        |
| MEOL      | Medical Care on Board                    | STCW Reg. VI/4        |
| GMDSS     | Global Maritime Distress & Safety System | STCW Reg. IV/2        |
| OOW       | Officer of the Watch                     | STCW Reg. II/1        |
| ENG1      | Medical Fitness Certificate              | MCA (UK)              |

---

## 11.4 Istilah Pelayaran (Voyage)

| Istilah Inggris     | Istilah Indonesia      | Kode              | Keterangan                       |
| ------------------- | ---------------------- | ----------------- | -------------------------------- |
| Voyage              | Pelayaran              | `voyage`          | Satu trip A → B                  |
| Port of Call        | Pelabuhan Singgah      | `portOfCall`      | Setiap pelabuhan yang disinggahi |
| Port of Departure   | Pelabuhan Asal         | `departurePort`   |                                  |
| Port of Destination | Pelabuhan Tujuan       | `destinationPort` |                                  |
| Departure           | Keberangkatan          | `departure`       |                                  |
| Arrival             | Kedatangan             | `arrival`         |                                  |
| ETA                 | Estimasi Tiba          | `eta`             | Estimated Time of Arrival        |
| ETD                 | Estimasi Berangkat     | `etd`             | Estimated Time of Departure      |
| ATD                 | Waktu Aktual Berangkat | `atd`             | Actual Time of Departure         |
| ATA                 | Waktu Aktual Tiba      | `ata`             | Actual Time of Arrival           |
| Noon Report         | Laporan Noon           | `noonReport`      | Laporan harian posisi kapal      |
| Cargo               | Muatan                 | `cargo`           |                                  |
| Ballast             | Ballast (Tanpa Muatan) | `ballast`         | Kondisi kapal tanpa muatan       |
| Laden               | Bermuatan              | `laden`           | Kondisi kapal dengan muatan      |

---

## 11.5 Istilah Teknikal & PMS

| Istilah Inggris | Istilah Indonesia          | Kode            | Keterangan                      |
| --------------- | -------------------------- | --------------- | ------------------------------- |
| PMS             | Planned Maintenance System | `pms`           | Sistem perawatan terencana      |
| Work Order      | Perintah Kerja             | `workOrder`     |                                 |
| Defect          | Kerusakan / Defek          | `defect`        |                                 |
| Dry Dock        | Dok Kering                 | `dryDock`       | Perawatan besar di galangan     |
| Running Hours   | Jam Jalan                  | `runningHours`  | Jam operasi mesin               |
| Due Date        | Jatuh Tempo                | `dueDate`       | Waktu perawatan harus dilakukan |
| Overdue         | Terlambat                  | `overdue`       | Melewati due date               |
| Spare Parts     | Suku Cadang                | `spareParts`    |                                 |
| Critical Spare  | Suku Cadang Kritis         | `criticalSpare` | Tidak boleh habis               |
| Maker           | Pabrikan                   | `maker`         | Manufacturer mesin/equipment    |
| Part Number     | Nomor Part                 | `partNumber`    |                                 |

---

## 11.6 Istilah HSSEQ / ISM

| Singkatan      | Kepanjangan                                          | UI Label                     |
| -------------- | ---------------------------------------------------- | ---------------------------- |
| ISM Code       | International Safety Management Code                 | Kode ISM                     |
| SMS            | Safety Management System                             | Sistem Manajemen Keselamatan |
| HSSEQ          | Health, Safety, Security, Environment & Quality      | HSSEQ                        |
| PSC            | Port State Control                                   | Inspeksi PSC                 |
| Deficiency     | Deficiency / Temuan PSC                              | Temuan PSC                   |
| Detention      | Detention / Penahanan Kapal                          | Penahanan                    |
| Near Miss      | Near Miss / Hampir Celaka                            | Near Miss                    |
| Incident       | Insiden                                              | Insiden                      |
| Non-Conformity | Ketidaksesuaian                                      | Ketidaksesuaian              |
| CAP            | Corrective Action Plan                               | Rencana Tindakan Korektif    |
| ISPS           | International Ship & Port Facility Security          | Keamanan Kapal ISPS          |
| SSO            | Ship Security Officer                                | Petugas Keamanan Kapal       |
| SSP            | Ship Security Plan                                   | Rencana Keamanan Kapal       |
| MARSEC         | Maritime Security Level                              | Level Keamanan Maritim       |
| MARPOL         | International Convention for Prevention of Pollution | Konvensi MARPOL              |
| SOLAS          | Safety of Life at Sea                                | Konvensi SOLAS               |
| MLC            | Maritime Labour Convention                           | Konvensi MLC 2006            |

---

## 11.7 Regulasi & Otoritas Indonesia

| Singkatan    | Kepanjangan                            | Fungsi                         |
| ------------ | -------------------------------------- | ------------------------------ |
| Kemenhub     | Kementerian Perhubungan                | Otoritas transportasi nasional |
| Ditjen Hubla | Direktorat Jenderal Perhubungan Laut   | Regulator pelayaran            |
| KPLP         | Kesatuan Penjagaan Laut dan Pantai     | Coast guard Indonesia          |
| BKI          | Biro Klasifikasi Indonesia             | Biro klasifikasi nasional      |
| Syahbandar   | Syahbandar / Harbormaster              | Port authority lokal           |
| SIUP         | Surat Izin Usaha Pelayaran             | Lisensi usaha pelayaran        |
| BKP          | Bukti Kelaikan Pelayaran               | Sertifikat laik layar          |
| PP 71/2019   | Peraturan Pemerintah No. 71 Tahun 2019 | Keselamatan pelayaran          |

---

## 11.8 Singkatan Teknis yang Sering Salah

| ❌ Salah    | ✅ Benar         | Keterangan                                     |
| ----------- | ---------------- | ---------------------------------------------- |
| Captain     | Master / Nakhoda | "Kapten" tidak formal dalam IMO                |
| Ship        | Vessel           | Gunakan vessel di kode formal                  |
| Crew member | Seafarer         | Terminologi IMO resmi                          |
| Weight      | Tonnage          | Kapal diukur dalam tonnage, bukan weight       |
| Speed       | Speed (knots)    | Kecepatan kapal dalam knot, bukan km/h         |
| Port        | Port of Call     | Spesifik untuk singgah dalam voyage            |
| Hire        | Contract         | Kontrak pelaut disebut "Perjanjian Kerja Laut" |

---

_File ini adalah kamus domain. Setiap kali ada istilah baru yang muncul dalam diskusi atau requirement, tambahkan di sini sebelum diimplementasikan._
