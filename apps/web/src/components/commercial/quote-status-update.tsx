"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Send, 
  Check, 
  X, 
  Clock,
  RefreshCw
} from "lucide-react";

interface QuoteStatusUpdateProps {
  currentStatus: string;
  onStatusUpdate: (status: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Rascunho",
    description: "Orçamento em elaboração",
    icon: FileText,
    color: "outline" as const,
  },
  {
    value: "sent",
    label: "Enviado",
    description: "Aguardando resposta do cliente",
    icon: Send,
    color: "secondary" as const,
  },
  {
    value: "approved",
    label: "Aprovado",
    description: "Cliente aprovou o orçamento",
    icon: Check,
    color: "default" as const,
  },
  {
    value: "rejected",
    label: "Rejeitado",
    description: "Cliente rejeitou o orçamento",
    icon: X,
    color: "destructive" as const,
  },
  {
    value: "expired",
    label: "Expirado",
    description: "Orçamento passou da validade",
    icon: Clock,
    color: "destructive" as const,
  },
];

export function QuoteStatusUpdate({ 
  currentStatus, 
  onStatusUpdate, 
  onClose, 
  isLoading 
}: QuoteStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleSubmit = () => {
    if (selectedStatus !== currentStatus) {
      onStatusUpdate(selectedStatus);
    }
    onClose();
  };

  const availableOptions = STATUS_OPTIONS.filter(option => {
    // Não permitir voltar para converted
    if (option.value === "converted") return false;
    
    // Se já está convertido, não permitir mudanças
    if (currentStatus === "converted") return false;
    
    return true;
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Atualizar Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status atual:</span>
            <Badge variant={getStatusVariant(currentStatus)}>
              {getStatusLabel(currentStatus)}
            </Badge>
          </div>

          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="space-y-3">
              {availableOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <option.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || selectedStatus === currentStatus}
            >
              {isLoading ? "Atualizando..." : "Atualizar Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    expired: "Expirado",
    converted: "Convertido",
  };
  
  return labels[status] || status;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "secondary",
    approved: "default",
    rejected: "destructive",
    expired: "destructive",
    converted: "default",
  };
  
  return variants[status] || "outline";
}