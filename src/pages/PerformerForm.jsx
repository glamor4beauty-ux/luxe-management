import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import PerformerFormFields from "../components/performers/PerformerFormFields";
import { toast } from "sonner";

export default function PerformerForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = editId && editId !== 'new';
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!isEdit);

  useEffect(() => {
    if (isEdit) {
      base44.entities.Performer.filter({ id: editId }).then(res => {
        if (res.length > 0) setData(res[0]);
        setLoading(false);
      });
    }
  }, [isEdit, editId]);

  const handleSave = async () => {
    if (!data.firstName || !data.lastName || !data.email || !data.stageName) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email, Stage Name)");
      return;
    }
    setSaving(true);
    // Strip built-in fields before saving
    const { id, created_date, updated_date, created_by, ...saveData } = data;
    if (isEdit) {
      await base44.entities.Performer.update(editId, saveData);
      toast.success("Performer updated!");
    } else {
      await base44.entities.Performer.create(saveData);
      toast.success("Performer created!");
    }
    setSaving(false);
    navigate('/performers');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/performers')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? 'Edit' : 'Add'} Performer</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fill in the performer details below</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isEdit ? 'Update' : 'Save'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <PerformerFormFields data={data} onChange={setData} />
      </div>
    </div>
  );
}