import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PenTool, Trash2, CheckCircle2 } from 'lucide-react';

export default function ElectronicSignature({ booking, onSign }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isSigned, setIsSigned] = useState(booking?.contract_signed || false);
  const canvasRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left,
      e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.lineTo(
      e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left,
      e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    );
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature || !accepted) return;
    
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    
    await onSign(signatureData);
    setIsSigned(true);
  };

  if (isSigned) {
    return (
      <Card className="border-0 shadow-sm bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 mb-1">Contrat signé électroniquement</h3>
          <p className="text-sm text-green-700">
            Le {new Date(booking.contract_signed_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          Signature électronique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <p className="text-sm text-slate-600 mb-3">Signez avec votre souris ou votre doigt :</p>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border border-slate-300 rounded bg-white cursor-crosshair w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="mt-2 text-slate-500"
            disabled={!hasSignature}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Effacer
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
          <Checkbox 
            id="accept-terms" 
            checked={accepted}
            onCheckedChange={setAccepted}
          />
          <Label htmlFor="accept-terms" className="text-sm text-amber-900 cursor-pointer">
            Je certifie avoir lu et accepté l'ensemble des clauses du contrat de location. 
            Je reconnais que cette signature électronique a la même valeur qu'une signature manuscrite.
          </Label>
        </div>

        <Button 
          onClick={handleSign}
          disabled={!hasSignature || !accepted}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Signer le contrat
        </Button>

        <p className="text-xs text-slate-500 text-center">
          La signature sera horodatée et associée à votre email ({booking.guest_email})
        </p>
      </CardContent>
    </Card>
  );
}