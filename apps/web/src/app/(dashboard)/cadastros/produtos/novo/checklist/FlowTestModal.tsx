"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, RotateCcw, X } from 'lucide-react';

interface FlowTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklistData: {
    nodes: any[];
    edges: any[];
    selections?: any;
  } | null;
}

export default function FlowTestModal({ isOpen, onClose, checklistData }: FlowTestModalProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [flowPath, setFlowPath] = useState<string[]>([]);

  // Reset quando modal abre
  useEffect(() => {
    if (isOpen && checklistData?.nodes?.length) {
      // Encontrar o nó inicial (start ou primeiro question)
      const startNode = checklistData.nodes.find(node => node.type === 'start');
      const firstQuestionNode = checklistData.nodes.find(node => node.type === 'question');
      
      if (startNode) {
        // Se há um nó start, encontrar a próxima pergunta conectada
        const startEdge = checklistData.edges?.find(edge => edge.source === startNode.id);
        const nextNodeId = startEdge?.target || firstQuestionNode?.id;
        setCurrentNodeId(nextNodeId || null);
      } else if (firstQuestionNode) {
        setCurrentNodeId(firstQuestionNode.id);
      }
      
      setAnswers({});
      setIsCompleted(false);
      setFlowPath([]);
    }
  }, [isOpen, checklistData]);

  const getCurrentNode = () => {
    if (!currentNodeId || !checklistData?.nodes) return null;
    return checklistData.nodes.find(node => node.id === currentNodeId);
  };

  const handleAnswer = (optionId: string, optionText: string) => {
    if (!currentNodeId) return;

    const newAnswers = { ...answers, [currentNodeId]: optionText };
    setAnswers(newAnswers);
    setFlowPath(prev => [...prev, currentNodeId]);

    // Encontrar próximo nó baseado na resposta
    const nextEdge = checklistData?.edges?.find(edge => 
      edge.source === currentNodeId && edge.sourceHandle === optionId
    );

    if (nextEdge) {
      const nextNode = checklistData?.nodes?.find(node => node.id === nextEdge.target);
      
      if (nextNode?.type === 'end') {
        setIsCompleted(true);
        setCurrentNodeId(null);
      } else {
        setCurrentNodeId(nextEdge.target);
      }
    } else {
      // Se não há próximo nó, finalizar o teste
      setIsCompleted(true);
      setCurrentNodeId(null);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setIsCompleted(false);
    setFlowPath([]);
    
    // Reiniciar do primeiro nó
    const startNode = checklistData?.nodes?.find(node => node.type === 'start');
    const firstQuestionNode = checklistData?.nodes?.find(node => node.type === 'question');
    
    if (startNode) {
      const startEdge = checklistData?.edges?.find(edge => edge.source === startNode.id);
      const nextNodeId = startEdge?.target || firstQuestionNode?.id;
      setCurrentNodeId(nextNodeId || null);
    } else if (firstQuestionNode) {
      setCurrentNodeId(firstQuestionNode.id);
    }
  };

  const currentNode = getCurrentNode();

  if (!checklistData?.nodes?.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testar Fluxo</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>Nenhum fluxo configurado para testar.</p>
            <p className="text-sm mt-2">Adicione perguntas ao checklist primeiro.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Testar Fluxo do Checklist</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetTest}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                Fechar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progresso */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Progresso do Teste</span>
              <span className="text-muted-foreground">
                {flowPath.length} de {checklistData.nodes.filter(n => n.type === 'question').length} perguntas
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(flowPath.length / Math.max(checklistData.nodes.filter(n => n.type === 'question').length, 1)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Respostas anteriores */}
          {flowPath.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Respostas Anteriores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {flowPath.map((nodeId, index) => {
                  const node = checklistData.nodes.find(n => n.id === nodeId);
                  const answer = answers[nodeId];
                  
                  return (
                    <div key={nodeId} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{node?.data?.question}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary">{answer}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Pergunta atual */}
          {currentNode && !isCompleted && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {flowPath.length + 1}
                  </div>
                  {currentNode.data.question}
                </CardTitle>
                {currentNode.data.description && (
                  <p className="text-sm text-muted-foreground">{currentNode.data.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {currentNode.data.options?.map((option: any, index: number) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      className="justify-start h-auto p-4 text-left hover:border-primary hover:bg-primary/5"
                      onClick={() => handleAnswer(option.id, option.label || option.text)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div>
                          <div className="font-medium">{option.label || option.text}</div>
                          {option.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado final */}
          {isCompleted && (
            <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Teste Concluído!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Você completou o fluxo do checklist com sucesso. 
                  Todas as perguntas foram respondidas conforme a configuração.
                </p>
                <div className="flex gap-2">
                  <Button onClick={resetTest} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Testar Novamente
                  </Button>
                  <Button onClick={onClose}>
                    Finalizar Teste
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}