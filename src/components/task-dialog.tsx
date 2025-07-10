
"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { analyzeMeal, type AnalyzeMealOutput } from "@/ai/flows/analyze-meal-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { MealLog, FoodItem } from "@/lib/types";

interface MealCaptureDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: Omit<MealLog, "id" | "createdAt">) => void;
}

const resizeImage = (dataUri: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.9)); // Use JPEG for smaller size
        };
        img.onerror = (err) => reject(err);
        img.src = dataUri;
    });
};


export function MealCaptureDialog({ isOpen, setIsOpen, onSubmit }: MealCaptureDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMealOutput | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera not supported on this device.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasCameraPermission(false);
          setError("Camera access denied. Please enable camera permissions in your browser settings.");
        }
      };
      getCameraPermission();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  }, [isOpen]);

  const resetState = () => {
      setIsAnalyzing(false);
      setAnalysisResult(null);
      setPhotoDataUri(null);
      setError(null);
  }

  const handleClose = () => {
    resetState();
    setIsOpen(false);
  }

  const handleRetake = () => {
    setPhotoDataUri(null);
    setAnalysisResult(null);
    setError(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataUri = canvas.toDataURL('image/jpeg');
    
    try {
        const resizedUri = await resizeImage(dataUri);
        setPhotoDataUri(resizedUri);
    } catch (err) {
        console.error("Failed to resize image", err);
        setError("Could not process the captured photo. Please try again.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
            const resizedUri = await resizeImage(dataUri);
            setPhotoDataUri(resizedUri);
        } catch (err) {
            console.error("Failed to resize image", err);
            setError("Could not process the uploaded photo. Please try again.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photoDataUri) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeMeal({ photoDataUri });
      if (!result.foodItems || result.foodItems.length === 0) {
        throw new Error("Could not identify any food items. Please try another photo.");
      }
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleLogMeal = () => {
    if (!analysisResult || !photoDataUri) return;

    const totalCalories = analysisResult.foodItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = analysisResult.foodItems.reduce((sum, item) => sum + item.protein, 0);
    const totalCarbs = analysisResult.foodItems.reduce((sum, item) => sum + item.carbs, 0);
    const totalFat = analysisResult.foodItems.reduce((sum, item) => sum + item.fat, 0);
    
    onSubmit({
        foodItems: analysisResult.foodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        photoUrl: photoDataUri, // In a real app, upload this to storage and get a URL
    });
    handleClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose()}}>
      <DialogContent className="sm:max-w-md grid grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogDescription>
            Capture a photo of your meal for AI analysis or upload an image.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 space-y-4">
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          
          {!photoDataUri && (
            <div className="space-y-4">
              <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {!hasCameraPermission && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><p>Waiting for camera...</p></div>}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button onClick={capturePhoto} disabled={!hasCameraPermission} className="w-full">
                  <Camera className="mr-2 h-4 w-4" /> Snap Photo
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          )}

          {photoDataUri && !analysisResult && (
             <div className="space-y-4">
                <img src={photoDataUri} alt="Meal preview" className="rounded-md w-full" />
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Meal"}
                </Button>
             </div>
          )}

          {analysisResult && (
            <div className="space-y-4">
                <img src={photoDataUri!} alt="Analyzed meal" className="rounded-md w-full" />
                <Card>
                    <CardHeader><CardTitle>Analysis Result</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        {analysisResult.foodItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-2 gap-2">
                                <span>{item.name}</span>
                                <span className="text-right">{item.calories} kcal</span>
                            </div>
                        ))}
                        <hr className="my-2 border-border" />
                        <div className="grid grid-cols-2 gap-2 font-bold">
                           <span>Total Calories</span>
                           <span className="text-right">{analysisResult.foodItems.reduce((acc, i) => acc + i.calories, 0)} kcal</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          {photoDataUri && <Button type="button" variant="outline" onClick={handleRetake}>Retake</Button>}
          {analysisResult && <Button onClick={handleLogMeal} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Log Meal</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
