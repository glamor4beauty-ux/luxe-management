import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusConfig = {
  pending: { icon: Circle, color: 'text-yellow-500', label: 'Pending', bgColor: 'bg-yellow-500/10' },
  in_progress: { icon: Clock, color: 'text-blue-500', label: 'In Progress', bgColor: 'bg-blue-500/10' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed', bgColor: 'bg-green-500/10' },
  cancelled: { icon: AlertCircle, color: 'text-red-500', label: 'Cancelled', bgColor: 'bg-red-500/10' },
};

export default function PerformerTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    async function load() {
      if (!user?.stageName) {
        setLoading(false);
        return;
      }
      try {
        const data = await base44.entities.Task.filter({ performerStageName: user.stageName });
        setTasks(data || []);
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(prev => ({ ...prev, [taskId]: true }));
    try {
      await base44.entities.Task.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast.success(`Task marked as ${statusConfig[newStatus].label.toLowerCase()}`);
    } catch (e) {
      toast.error('Failed to update task');
    }
    setUpdating(prev => ({ ...prev, [taskId]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.stageName) {
    return <div className="text-center py-8 text-muted-foreground">Stage name not found.</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tasks assigned yet.</p>
      </div>
    );
  }

  const groupedTasks = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    cancelled: tasks.filter(t => t.status === 'cancelled'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Total: {tasks.length}</p>
      </div>

      {Object.entries(groupedTasks).map(([statusKey, statusTasks]) => {
        if (statusTasks.length === 0) return null;
        const config = statusConfig[statusKey];
        const Icon = config.icon;

        return (
          <div key={statusKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <h2 className="text-sm font-semibold text-foreground">
                {config.label} ({statusTasks.length})
              </h2>
            </div>

            <div className="space-y-2">
              {statusTasks.map(task => (
                <div key={task.id} className={`border border-border rounded-lg p-4 ${config.bgColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {task.priority && (
                          <span className={`px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-green-500/10 text-green-600'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        )}
                        {task.deadline && (
                          <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusKey !== 'completed' && statusKey !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          disabled={updating[task.id]}
                          className="text-xs border-border"
                        >
                          {updating[task.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}