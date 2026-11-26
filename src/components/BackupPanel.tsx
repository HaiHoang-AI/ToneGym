import { useRef, useState } from 'react';
import { useL } from '../app/useL';
import { exportAll, importAll, validateBackup } from '../db/backup';

/** Download all local data as JSON, or replace it from a backup file. */
export function BackupPanel() {
  const l = useL();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earlab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: l('Đã tải file sao lưu.', 'Backup downloaded.') });
  };

  const restore = async (f: File) => {
    try {
      const data = validateBackup(JSON.parse(await f.text()));
      const profiles = data.tables.profiles?.length ?? 0;
      if (!window.confirm(l(`Thay toàn bộ dữ liệu hiện tại bằng bản sao lưu (${profiles} hồ sơ, ${data.exportedAt.slice(0, 10)})? Không hoàn tác được.`, `Replace all current data with this backup (${profiles} profiles, ${data.exportedAt.slice(0, 10)})? This cannot be undone.`))) return;
      await importAll(data);
      setMsg({ ok: true, text: l('Đã khôi phục. Đang tải lại…', 'Restored. Reloading…') });
      window.setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      setMsg({ ok: false, text: l(`Không khôi phục được: ${String(err)}`, `Could not restore: ${String(err)}`) });
    }
  };

  return (
    <section className="card flex flex-col gap-3 lg:col-span-2">
      <h2 className="text-xl font-semibold">{l('Sao lưu & khôi phục', 'Backup & restore')}</h2>
      <p className="text-sm text-muted">{l('Dữ liệu chỉ nằm trong trình duyệt này. Tải file sao lưu để giữ an toàn hoặc chuyển sang máy khác.', 'Data lives only in this browser. Download a backup to keep it safe or move it to another computer.')}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => void download()}>⬇ {l('Tải file sao lưu', 'Download backup')}</button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>⬆ {l('Khôi phục từ file…', 'Restore from file…')}</button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && void restore(e.target.files[0])} />
      </div>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? 'text-good-ink' : 'text-bad-ink'}`}>{msg.text}</p>}
    </section>
  );
}
