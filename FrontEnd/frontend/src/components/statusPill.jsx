import { Loader, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const statusConfig = {
  running: { label: 'Running', icon: <Loader size={9} className="spin" />, cls: 'running' },
  success: { label: 'Success', icon: <CheckCircle size={9} />, cls: 'success' },
  failed: { label: 'Failed', icon: <XCircle size={9} />, cls: 'failed' },
  paused: { label: 'Paused', icon: <AlertCircle size={9} />, cls: 'paused' },
  queued: { label: 'Queued', icon: <Clock size={9} />, cls: 'queued' },
};

export default function StatusPill({ status }) {
  const cfg = statusConfig[status] || statusConfig.queued;
  return (
    <span className={`status-pill ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}