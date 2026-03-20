import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';

export default function LoginButton() {
  return (
    <Button 
      onClick={() => base44.auth.redirectToLogin("/")}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <LogIn className="h-4 w-4 mr-2" /> Login
    </Button>
  );
}