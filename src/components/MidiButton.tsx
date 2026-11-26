import { midi, useMidiState } from '../audio/midi';
import { useL } from '../app/useL';

/** "Find devices": connects Web MIDI keyboards; shows what is connected. */
export function MidiButton() {
  const l = useL();
  const s = useMidiState();
  if (!s.supported) return <span className="text-xs text-muted">{l('Trình duyệt không hỗ trợ MIDI', 'No Web MIDI in this browser')}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs text-muted">
      <button type="button" className="btn btn-sm" onClick={() => void midi.connect()}>
        🎹 {s.connected ? l('Tìm lại thiết bị MIDI', 'Rescan MIDI') : l('Kết nối bàn phím MIDI', 'Connect MIDI keyboard')}
      </button>
      {s.connected && (s.devices.length ? s.devices.join(', ') : l('Chưa thấy thiết bị nào', 'No device found'))}
      {s.error && <span className="text-bad-ink">{l('Không mở được MIDI', 'Could not open MIDI')}</span>}
    </span>
  );
}
