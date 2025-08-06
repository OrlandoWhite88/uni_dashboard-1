import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TariffInfo from "@/components/TariffInfo";
import HSCodeSubtree from "@/components/HSCodeSubtree";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: string;
  hsCode: string;
  confidence: number;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  hsCode,
  confidence
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">HS Code Details: {hsCode}</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Product: {product}
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              {confidence}% confidence
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="tariff" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="tariff">Tariff Information</TabsTrigger>
            <TabsTrigger value="validate">Validate Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tariff" className="mt-0">
            <TariffInfo hsCode={hsCode} />
          </TabsContent>
          
          <TabsContent value="validate" className="mt-0">
            <HSCodeSubtree hsCode={hsCode} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
