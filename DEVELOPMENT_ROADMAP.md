# SocialMock Motion Editor Development Roadmap

Dokumen ini menjadi arah pengembangan SocialMock agar bergerak dari editor prototype menuju aplikasi desktop motion graphics yang sistemnya kuat, mirip Jitter.video, dan layak dipakai sebagai tool produksi.

## Target Produk

SocialMock diarahkan menjadi editor motion graphics desktop untuk membuat mockup social content, komentar, DM, title card, ads, dan template animasi singkat. Fokus utamanya bukan hanya tampilan, tetapi sistem editor:

- Project/file workflow yang nyata.
- Motion document yang stabil dan bisa dimigrasikan.
- Timeline seperti video editor.
- Action/keyframe engine yang editable.
- Preview dan export yang konsisten.
- Template sebagai dokumen motion yang bisa diedit ulang.
- Desktop app yang terasa native lewat Electron.

## Status Saat Ini

Fondasi yang sudah ada:

- Dashboard awal dengan Drafts dan Templates.
- Template dapat dibuat menjadi `MotionDocument`.
- Model `MotionDocument` mulai dipakai untuk scene aktif.
- Selection model untuk canvas, layer, dan action.
- Contextual right inspector.
- Left toolbar dan top bar yang lebih bersih.
- Timeline dock dengan action blocks.
- Action Inspector.
- Add Action Menu.
- Action Engine v2 berbasis property action: `opacity`, `x`, `y`, `scale`, `rotate`, `blur`.
- Undo/Redo snapshot command system.
- Preview/export background mulai disamakan.
- Gemini API sudah dipindah ke Electron main process.
- Playwright sudah terpasang untuk smoke test.
- Build `.exe` sudah berhasil dibuat lewat Electron Builder.

Keterbatasan utama:

- Project masih belum memakai real file persistence.
- Undo/redo masih snapshot-level, belum command granular.
- Timeline belum bisa drag/resize action block secara penuh seperti video editor.
- Motion engine belum mendukung keyframe multi-point.
- Template system belum production-grade.
- Asset handling belum ada.
- Electron belum punya native file menu, recent files, dirty state, dan app icon.
- Export pipeline masih perlu hardening dan regression test.
- Bundle masih memberi warning chunk >500KB.

## UI/UX Reference - Jitter.video Editor

Berdasarkan referensi Jitter.video, arah UI/UX SocialMock perlu lebih dekat ke pola editor motion profesional:

- Top bar gelap berisi tool utama, project title di tengah, zoom/share/export di kanan.
- Left sidebar berupa hierarchical layer tree, bukan hanya daftar layer flat.
- Canvas utama luas, minim chrome, dengan artboard jelas dan selection handle presisi.
- Right inspector padat, contextual, dan berbasis property rows.
- Tab `Design` dan `Animate` di inspector kanan.
- Animate inspector bersifat preset-first: pilih style motion, lalu edit mode, direction, duration, easing.
- Animation preset gallery memakai thumbnail visual, bukan hanya list teks.
- Layer property rows punya toggle/checkbox kecil untuk fitur seperti fill, stroke, shadow, blur, glass.
- Control angka compact, sejajar, dan mudah discan.
- UI tidak terlalu card-heavy; editor surface lebih utilitarian, tajam, dan rapat.

Implikasi untuk SocialMock:

- Layout sekarang sudah menuju arah yang benar, tetapi masih perlu dipadatkan dan dibuat lebih editor-like.
- Layer panel perlu berubah dari layer list sederhana menjadi tree dengan nested children.
- Inspector harus lebih schema-driven dan compact.
- Animation UX harus mengutamakan preset visual, baru detail property.
- Timeline dan canvas harus terasa sebagai pusat kerja, bukan sekadar preview.

## Milestone 1 - Real File Persistence Electron

Tujuan: mengubah aplikasi dari editor berbasis browser storage menjadi desktop app dengan project file nyata.

Checklist:

- [ ] Tentukan format file project, misalnya `.socialmock` atau `.socialmock.json`.
- [ ] Tambah `schemaVersion` di root `MotionDocument`.
- [ ] Implement Electron IPC untuk `newProject`, `openProject`, `saveProject`, `saveProjectAs`.
- [ ] Simpan path file aktif di renderer state.
- [ ] Tambah dirty state: `Saved`, `Unsaved changes`.
- [ ] Tambah Recent Files di storage Electron.
- [ ] Dashboard Drafts membaca recent/project index, bukan hanya `localStorage`.
- [ ] Autosave backup ke `app.getPath('userData')`.
- [ ] Recovery flow kalau autosave lebih baru dari file terakhir.
- [ ] Validasi file rusak dan tampilkan error yang manusiawi.

Definition of done:

- User bisa create, save, close, open ulang project tanpa kehilangan state.
- Dashboard menampilkan recent files.
- App tahu kapan ada unsaved changes.
- File project bisa dipindahkan dan dibuka lagi.

## Milestone 2 - MotionDocument Schema v2

Tujuan: membuat model dokumen cukup kuat untuk timeline, assets, templates, dan export.

Checklist:

- [ ] Tambah `schemaVersion`.
- [ ] Buat migration pipeline `migrateMotionDocument`.
- [ ] Pisahkan struktur:
  - `document.metadata`
  - `document.scenes`
  - `document.assets`
  - `document.timeline`
  - `document.exportSettings`
- [ ] Pastikan template juga berupa `MotionDocument`.
- [ ] Tambah thumbnail project.
- [ ] Tambah validator untuk layer/action/property.
- [ ] Kurangi ketergantungan UI langsung ke `CommentConfig`.
- [ ] Buat helper serialisasi dan deserialisasi dokumen.

Definition of done:

- Dokumen lama tetap bisa dibuka lewat migration.
- Template, draft, dan saved project memakai format yang sama.
- Struktur dokumen siap untuk asset dan keyframe system.

## Milestone 3 - Command System v2

Tujuan: membuat undo/redo lebih presisi, lebih hemat memori, dan siap untuk editor kompleks.

Checklist:

- [ ] Definisikan interface `EditorCommand`.
- [ ] Implement command granular:
  - `AddLayerCommand`
  - `DeleteLayerCommand`
  - `UpdateLayerCommand`
  - `ReorderLayerCommand`
  - `AddActionCommand`
  - `UpdateActionCommand`
  - `DeleteActionCommand`
  - `UpdateDocumentSettingsCommand`
- [ ] Tambah command merge untuk typing dan slider.
- [ ] Tambah batch command untuk preset yang mengubah banyak field.
- [ ] Tambah command labels yang tampil di tooltip Undo/Redo.
- [ ] Tambah history limit dan memory guard.
- [ ] Pastikan command restore selection.
- [ ] Tambah test undo/redo untuk layer, action, timeline, dan scene.

Definition of done:

- Undo/redo tidak lagi mengandalkan full snapshot untuk semua edit.
- Slider dan drag masuk sebagai satu command.
- Redo stack selalu clear saat user membuat edit baru.

## Milestone 4 - Timeline Editor v2

Tujuan: timeline terasa seperti video editor dan menjadi pusat motion editing.

Checklist:

- [ ] Drag action block untuk pindah start frame.
- [ ] Resize action block dari edge kiri/kanan.
- [ ] Snap ke grid, playhead, dan action lain.
- [ ] Timeline horizontal zoom.
- [ ] Pan/scroll timeline.
- [ ] Multi-select action blocks.
- [ ] Duplicate action block.
- [ ] Delete action block via keyboard.
- [ ] Context menu action: rename, duplicate, delete, split.
- [ ] Layer row height dan block layout stabil.
- [ ] Playhead bisa drag dari ruler.
- [ ] Keyboard navigation: left/right frame stepping.
- [ ] Test timeline drag, resize, snap, undo/redo.

Definition of done:

- User bisa mengatur timing action langsung dari timeline tanpa inspector.
- Timeline tetap rapi untuk banyak layer dan banyak action.
- Semua perubahan timeline bisa undo/redo.

## Milestone 5 - Keyframe And Property Track System

Tujuan: mengembangkan Action Engine v2 menjadi sistem animasi yang editable seperti editor motion.

Checklist:

- [ ] Buat model `PropertyTrack`.
- [ ] Support multiple keyframes per property.
- [ ] Easing per segment.
- [ ] Convert action preset menjadi property tracks.
- [ ] Mini keyframe editor di inspector.
- [ ] Add/delete keyframe pada current playhead.
- [ ] Support property values:
  - Opacity
  - X
  - Y
  - Scale
  - Rotate
  - Blur
  - Color atau fill untuk tahap berikutnya
- [ ] Resolve konflik antara layer transform dan motion transform.
- [ ] Support emphasis loop atau ping-pong untuk action tertentu.

Definition of done:

- Preset animation bisa diedit sebagai value.
- User bisa membuat motion custom tanpa menulis kode.
- Preview dan export memakai engine yang sama.

## Milestone 6 - Layer Model Cleanup

Tujuan: layer lebih modular, mudah ditambah, dan tidak bercampur dengan config legacy.

Checklist:

- [ ] Buat layer registry per type.
- [ ] Tiap layer type punya:
  - Defaults
  - Renderer
  - Inspector schema
  - Motion capabilities
- [ ] Card menjadi composite/group layer.
- [ ] Tambah group/folder layer.
- [ ] Lock layer.
- [ ] Rename layer inline.
- [ ] Solo layer.
- [ ] Visibility control yang konsisten.
- [ ] Z-index/order model yang deterministic.
- [ ] Copy/paste layer.
- [ ] Delete selected layer via keyboard.

Definition of done:

- Menambah layer type baru tidak perlu menyentuh banyak file besar.
- Layer panel terasa seperti editor profesional.

## Milestone 7 - Asset Manager

Tujuan: project bisa mengelola image/video/audio secara benar.

Checklist:

- [ ] Tambah `assets` di `MotionDocument`.
- [ ] Import image ke project.
- [ ] Simpan asset sebagai file copy di folder project atau app data.
- [ ] Asset library panel.
- [ ] Drag asset ke canvas.
- [ ] Replace missing asset flow.
- [ ] Support transparent PNG/WebP/SVG.
- [ ] Basic video asset support.
- [ ] Basic audio asset support untuk milestone lanjutan.

Definition of done:

- User bisa membuat project dengan asset lokal tanpa URL manual.
- Project tetap bisa dibuka ulang dengan asset yang sama.

## Milestone 8 - Template System v2

Tujuan: template menjadi fitur inti seperti Jitter, bukan hanya contoh statis.

Checklist:

- [ ] Template disimpan sebagai `MotionDocument`.
- [ ] Template categories:
  - Social media
  - Ads
  - Devices
  - Video titles
  - Logos
  - Branding
  - Websites
  - UI elements
  - Charts
  - Text
- [ ] Search template.
- [ ] Filter by category.
- [ ] Preview thumbnail.
- [ ] Preview animated loop untuk template unggulan.
- [ ] `Use template` membuat copy editable.
- [ ] Template variables:
  - Brand color
  - Text
  - Avatar
  - Platform
  - Image placeholders
- [ ] Tambah minimal 12 template berkualitas.

Definition of done:

- User bisa mulai dari template dan langsung edit isi/motion-nya.
- Template gallery terasa sebagai bagian utama produk.

## Milestone 9 - Inspector Polish

Tujuan: inspector lebih cepat, rapi, dan nyaman untuk editing berulang.

Checklist:

- [ ] Section collapse.
- [ ] Numeric input dengan drag scrub.
- [ ] Color picker lebih baik.
- [ ] Unit labels konsisten: px, %, frame, second.
- [ ] Generated controls dari schema layer/action.
- [ ] Empty state saat canvas/scene dipilih.
- [ ] Inspector action menampilkan property track dengan lebih compact.
- [ ] Preset-to-keyframe conversion.
- [ ] Perbaiki focus dan keyboard behavior.

Definition of done:

- Inspector terasa padat, predictable, dan tidak melelahkan untuk dipakai lama.

## Milestone 10 - UI/UX Editor Parity And Visual Polish

Tujuan: membuat pengalaman editor lebih dekat ke Jitter.video: padat, jelas, cepat discan, dan terasa seperti tool motion profesional.

### 10.1 App Shell And Top Bar

Checklist:

- [ ] Ubah top bar menjadi editor command strip yang lebih gelap dan compact.
- [ ] Letakkan project title di tengah dengan dropdown kecil.
- [ ] Letakkan Share atau collaboration placeholder di kanan sebelum Export.
- [ ] Zoom control kanan atas, compact seperti `58%`.
- [ ] Export button menjadi primary command paling kanan.
- [ ] Tambah back button yang jelas untuk kembali ke file dashboard.
- [ ] Tool icons utama berada di bar atas atau rail kiri dengan visual hierarchy jelas.
- [ ] Kurangi visual noise dari borders/shadows yang tidak perlu.

Definition of done:

- First impression editor langsung terbaca sebagai motion/design tool.
- Top bar bisa dipakai untuk command utama tanpa mengganggu canvas.

### 10.2 Left Layer Tree

Checklist:

- [ ] Ganti layer list flat menjadi hierarchical layer tree.
- [ ] Support expand/collapse group.
- [ ] Tampilkan nested structure untuk composite layer seperti Tweet/Card.
- [ ] Tambah icon type: group, text, image, shape, card, background.
- [ ] Tambah lock/unlock layer.
- [ ] Tambah visibility toggle.
- [ ] Tambah selected row highlight yang kuat.
- [ ] Tambah indentation dan connector yang rapi.
- [ ] Tambah inline rename layer.
- [ ] Tambah drag reorder dalam tree.
- [ ] Tambah context menu layer.

Definition of done:

- Struktur dokumen bisa dibaca dari kiri seperti Jitter.
- User bisa memilih child element tanpa harus klik canvas.

### 10.3 Canvas And Selection Chrome

Checklist:

- [ ] Buat canvas workspace lebih luas dan minim panel visual.
- [ ] Artboard border lebih presisi.
- [ ] Selection outline menggunakan aksen violet yang konsisten.
- [ ] Resize handles kecil, tajam, dan tidak terlalu bulky.
- [ ] Label layer terpilih muncul compact di atas selection.
- [ ] Tampilkan scene duration label seperti `Tweet - 5s`.
- [ ] Tambah smart sparkle/action affordance kecil hanya saat relevan.
- [ ] Pastikan selection chrome tidak muncul di export.
- [ ] Pastikan canvas tetap nyaman pada zoom rendah dan tinggi.

Definition of done:

- Canvas terasa seperti area kerja utama, bukan preview card.
- Selection mudah dilihat tanpa menutupi konten.

### 10.4 Right Inspector Density

Checklist:

- [ ] Ubah inspector menjadi property rows yang lebih compact.
- [ ] Gunakan two-column numeric fields untuk position dan size.
- [ ] Buat section rows seperti Layout, Opacity, Corner, Fill, Stroke, Shadow, Blur, Glass.
- [ ] Setiap feature row punya enable checkbox/toggle di kanan.
- [ ] Color input punya swatch kecil dan hex input.
- [ ] Kurangi card besar dalam inspector.
- [ ] Gunakan divider horizontal tipis antar section.
- [ ] Sticky Design/Animate tabs di atas inspector.
- [ ] Tambah overflow scroll yang halus.
- [ ] Tambah ellipsis menu per section jika butuh advanced action.

Definition of done:

- Inspector muat lebih banyak kontrol tanpa terasa berantakan.
- User bisa scan property seperti di Jitter.

### 10.5 Animate Panel UX

Checklist:

- [ ] Animate tab menampilkan selected animation summary di atas.
- [ ] Tombol `Change` membuka preset gallery.
- [ ] Mode segmented control: `In` dan `Out`.
- [ ] Direction control memakai icon arrows.
- [ ] Fade toggle tersedia untuk slide-like motion.
- [ ] Duration input tampil dalam seconds, tetap tersimpan sebagai frames.
- [ ] Easing row punya dropdown/picker.
- [ ] Preset action tetap bisa masuk ke property tracks.
- [ ] Inspector action detail tetap tersedia untuk advanced editing.

Definition of done:

- User awam bisa pilih motion cepat.
- User advanced tetap bisa edit property action.

### 10.6 Motion Preset Gallery

Checklist:

- [ ] Buat gallery preset visual seperti Jitter.
- [ ] Kelompok preset:
  - Fade
  - Scale
  - Mask
  - Blur
  - Slide
  - Rotate
  - Emphasis
- [ ] Setiap preset punya thumbnail preview.
- [ ] Thumbnail bisa berupa generated preview dari MotionDocument mini.
- [ ] Klik preset langsung apply ke selected layer/action.
- [ ] Search preset.
- [ ] Filter `In`, `Out`, `Emphasis`.
- [ ] Tandai preset aktif.
- [ ] Support custom/user presets untuk tahap lanjut.

Definition of done:

- Animation selection tidak lagi terasa seperti dropdown teks.
- User bisa memahami efek motion sebelum apply.

### 10.7 Design System And Visual Cleanup

Checklist:

- [ ] Tetapkan token warna editor:
  - Background workspace
  - Panel background
  - Accent violet
  - Text primary/secondary
  - Divider
  - Disabled state
- [ ] Tetapkan spacing scale untuk panel, row, button, input.
- [ ] Tetapkan icon size konsisten.
- [ ] Kurangi border radius berlebihan di editor controls.
- [ ] Hindari nested card di inspector.
- [ ] Kurangi shadow dekoratif, pakai border/divider.
- [ ] Pastikan text tidak overflow pada button dan panel.
- [ ] Responsive desktop-first, mobile secondary.
- [ ] Buat visual regression screenshots untuk editor utama.

Definition of done:

- UI terasa satu sistem, bukan kumpulan komponen yang ditempel bertahap.
- Editor lebih mirip professional motion tool daripada landing-page UI.

### 10.8 UX Interaction Details

Checklist:

- [ ] Hover state setiap clickable row jelas.
- [ ] Disabled state tidak membingungkan.
- [ ] Cursor sesuai aksi: move, resize, text, pointer.
- [ ] Keyboard focus ring rapi.
- [ ] Escape clear selection atau close popover.
- [ ] Enter commit rename.
- [ ] Delete/backspace delete selected layer/action.
- [ ] Context menu tidak menabrak viewport.
- [ ] Toast hanya untuk event penting, bukan setiap edit kecil.

Definition of done:

- Interaksi kecil terasa matang dan konsisten.

## Milestone 11 - Canvas Editing v2

Tujuan: canvas editing terasa seperti design/motion tool.

Checklist:

- [ ] Smart guides.
- [ ] Snap to center.
- [ ] Snap to edges.
- [ ] Snap to other layers.
- [ ] Multi-select layers.
- [ ] Bounding box multi-select.
- [ ] Rotate handle.
- [ ] Keyboard nudging.
- [ ] Shift + arrow untuk nudge besar.
- [ ] Copy/paste layer.
- [ ] Delete/backspace selected layer.
- [ ] Better resize constraints.

Definition of done:

- User bisa menata layout dengan cepat tanpa mengandalkan inspector angka.

## Milestone 12 - Export Pipeline Production

Tujuan: export stabil, konsisten dengan preview, dan siap dipakai.

Checklist:

- [ ] Pastikan background preview/export/alpha selalu sama.
- [ ] Export PNG transparent dan solid.
- [ ] Export MP4.
- [ ] Export WebM.
- [ ] Export GIF.
- [ ] Export MOV jika pipeline mendukung.
- [ ] Alpha export support untuk format yang memungkinkan.
- [ ] Export presets: square, story, landscape, custom.
- [ ] Batch export scenes.
- [ ] Cancel render.
- [ ] Progress modal detail.
- [ ] Error reporting yang jelas.
- [ ] Regression test frame output.

Definition of done:

- Hasil export tidak berbeda dari preview.
- Render bisa dibatalkan.
- Error export tidak membuat app crash.

## Milestone 13 - Electron App Polish

Tujuan: desktop app terasa native dan siap dibagikan.

Checklist:

- [ ] Native menu: File, Edit, View, Export, Help.
- [ ] Menu shortcut:
  - New
  - Open
  - Save
  - Save As
  - Undo
  - Redo
  - Export
- [ ] Recent files di menu.
- [ ] App icon.
- [ ] Window state restore.
- [ ] Better dialog untuk error file/export.
- [ ] About window.
- [ ] Build metadata.
- [ ] Auto-update untuk fase distribusi.

Definition of done:

- App tidak terasa seperti web app dibungkus Electron saja.

## Milestone 14 - AI And Gemini Hardening

Tujuan: fitur AI aman, jelas, dan bisa diandalkan.

Checklist:

- [ ] Secure API key storage.
- [ ] Settings panel untuk Gemini API key.
- [ ] Retry dan timeout handling.
- [ ] Error states yang jelas.
- [ ] Prompt templates untuk comment variations.
- [ ] AI generate template copy.
- [ ] AI suggest motion preset untuk layer.
- [ ] Batasi request agar tidak spam.

Definition of done:

- AI bisa dipakai tanpa membahayakan API key di renderer.
- Error AI tidak mengganggu editing utama.

## Milestone 15 - Testing And QA

Tujuan: setiap perubahan besar bisa diverifikasi cepat.

Checklist:

- [ ] Tambah Playwright test suite permanen.
- [ ] Test create/open/save project.
- [ ] Test add layer.
- [ ] Test undo/redo.
- [ ] Test add action dan edit property.
- [ ] Test timeline drag/resize.
- [ ] Test export PNG.
- [ ] Test dashboard templates.
- [ ] Typecheck wajib.
- [ ] Build wajib.
- [ ] Smoke test Electron launch.

Definition of done:

- Flow utama punya test otomatis.
- Release tidak hanya bergantung pada klik manual.

## Milestone 16 - Performance And Bundle Optimization

Tujuan: app tetap cepat saat fitur bertambah.

Checklist:

- [ ] Code split dashboard dan editor.
- [ ] Lazy load Remotion/export libraries.
- [ ] Lazy load AI panel.
- [ ] Manual chunks untuk vendor besar.
- [ ] Memoize layer render berat.
- [ ] Kurangi write berulang ke storage/file.
- [ ] Virtualize timeline jika layer/action banyak.
- [ ] Profiling saat preview playback.

Definition of done:

- Warning chunk besar berkurang.
- Editor tetap responsif dengan banyak layer/action.

## Recommended PR Order

1. Real File Persistence Electron.
2. Native File Menu and Recent Files.
3. MotionDocument Schema v2 and migration.
4. UI/UX Editor Parity phase 1: top bar, layer tree, inspector density.
5. Timeline drag and resize action blocks.
6. Command System v2 granular commands.
7. Motion Preset Gallery with thumbnails.
8. Canvas selection chrome and smart guides.
9. Asset Manager basic.
10. Template Gallery v2.
11. Export Pipeline Production.
12. Electron app icon and release polish.
13. Playwright test suite permanen.
14. Performance and bundle optimization.

## Beta Completion Criteria

App dapat disebut beta jika semua poin ini terpenuhi:

- [ ] Project bisa dibuat, disimpan, dan dibuka ulang sebagai file nyata.
- [ ] Semua editing utama bisa undo/redo.
- [ ] Timeline bisa drag/resize action block.
- [ ] Editor shell, layer tree, inspector, dan animate panel terasa sekelas motion editor.
- [ ] Motion preset gallery punya thumbnail visual.
- [ ] Template bisa dipakai sebagai dokumen editable.
- [ ] Asset lokal bisa diimport dan tetap tersedia saat project dibuka ulang.
- [ ] Preview dan export konsisten.
- [ ] Export PNG dan video stabil.
- [ ] Build `.exe` punya app icon dan native menu.
- [ ] Flow utama memiliki Playwright tests.

## Catatan Teknis

- Jangan menambah fitur besar baru sebelum real file persistence selesai.
- Semua fitur motion baru sebaiknya masuk lewat `MotionDocument`, bukan menambah patch ad hoc ke `CommentConfig`.
- Preview dan export harus memakai engine yang sama.
- Setiap PR besar idealnya menyertakan:
  - Typecheck.
  - Build.
  - Minimal satu Playwright smoke test.
  - Catatan migration jika mengubah schema dokumen.
