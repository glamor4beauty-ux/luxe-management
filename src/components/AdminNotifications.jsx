import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { X, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  } catch (e) {
    // Audio not available
  }
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    // Small delay so we don't fire on initial load of existing records
    const timeout = setTimeout(() => {
      mountedRef.current = true;
    }, 3000);

    const unsubscribe = base44.entities.Performer.subscribe((event) => {
      if (!mountedRef.current) return;
      if (event.type !== 'create') return;

      const p = event.data;
      const notif = {
        id: event.id + Date.now(),
        performerId: event.id,
        name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'New Performer',
        stageName: p?.stageName || '',
        email: p?.email || '',
        time: new Date(),
      };

      setNotifications(prev => [notif, ...prev].slice(0, 5));
      playChime();
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [user]);

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleApprove = async (notif) => {
    await base44.entities.Performer.update(notif.performerId, { approved: true });
    dismiss(notif.id);
  };

  if (user?.role !== 'admin' || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className="bg-card border border-primary/40 rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="bg-primary/15 rounded-lg p-2 shrink-0 mt-0.5">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">New Performer Application</p>
              <p className="text-sm text-foreground mt-0.5">{n.name} {n.stageName ? `(@${n.stageName})` : ''}</p>
              <p className="text-xs text-muted-foreground truncate">{n.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(n)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Link to={`/performers/${n.performerId}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border" onClick={() => dismiss(n.id)}>
                    View
                  </Button>
                </Link>
              </div>
            </div>
            <button onClick={() => dismiss(n.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}