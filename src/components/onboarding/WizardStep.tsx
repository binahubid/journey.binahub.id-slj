import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface WizardStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  isSubmitting?: boolean;
  canNext?: boolean;
}

export function WizardStep({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onPrev,
  onNext,
  isSubmitting = false,
  canNext = true,
}: WizardStepProps) {
  return (
    <Card className="max-w-wizard mx-auto border-warm-border shadow-md bg-white space-y-6">
      <CardHeader className="border-b border-warm-border pb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-accent uppercase tracking-wider mb-1">
          <span>Langkah {stepNumber} dari {totalSteps}</span>
          <span>{Math.round((stepNumber / totalSteps) * 100)}% Complete</span>
        </div>
        <CardTitle className="text-xl font-bold text-navy-900">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 min-h-[240px]">
        {children}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t border-warm-border">
        {stepNumber > 1 ? (
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={isSubmitting} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        ) : (
          <div />
        )}

        <Button
          variant={stepNumber === totalSteps ? "accent" : "primary"}
          size="sm"
          onClick={onNext}
          disabled={!canNext || isSubmitting}
          className="font-semibold gap-1"
        >
          {isSubmitting ? (
            "Menyimpan Personal Transformation Project..."
          ) : stepNumber === totalSteps ? (
            <>
              Konfirmasi & Kunci PTP <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Lanjut <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
