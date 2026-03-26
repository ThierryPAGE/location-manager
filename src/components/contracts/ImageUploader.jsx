import React, { useState } from 'react';
import { base44 } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Copy, Check, Image as ImageIcon } from 'lucide-react';

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(result.file_url);
    } catch (error) {
      alert('Erreur lors de l\'upload');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const copyImageTag = () => {
    const imageTag = `<img src="${uploadedUrl}" width="200" />`;
    navigator.clipboard.writeText(imageTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-blue-100 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ImageIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 mb-1">Uploader une image</h3>
            <p className="text-xs text-slate-600 mb-3">
              Ex: signature, logo, cachet... à insérer dans le contrat
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">
                      {uploading ? 'Upload en cours...' : 'Choisir un fichier'}
                    </span>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {uploadedUrl && (
                <div className="space-y-2">
                  <div className="p-2 bg-white rounded border">
                    <img src={uploadedUrl} alt="Preview" className="max-w-full h-auto max-h-32 mx-auto" />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={`<img src="${uploadedUrl}" width="200" />`} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyImageTag}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Copiez cette balise et collez-la dans votre modèle de contrat
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}