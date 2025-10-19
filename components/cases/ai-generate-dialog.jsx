"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { realApi } from "@/lib/realApi";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function AIGenerateDialog({ open, onOpenChange, onImport, featureId }) {
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState("bytez-kei");
  const [availableModels, setAvailableModels] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generatedCases, setGeneratedCases] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Fetch available AI models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await realApi.ai.getAvailableModels();
        if (response.success && response.data.models) {
          setAvailableModels(response.data.models);
          // Set first active model as default
          const activeModel = response.data.models.find(
            (m) => m.status === "active"
          );
          if (activeModel) {
            setSelectedModel(activeModel.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI models:", error);
        toast.error("Failed to load AI models");
      }
    };

    if (open) {
      fetchModels();
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter a description for test case generation");
      return;
    }

    setIsGenerating(true);
    setGeneratedCases([]);

    try {
      const response = await realApi.ai.generateTestCases(
        inputText,
        selectedModel,
        {}
      );

      if (response.success && response.data.testCases) {
        if (response.data.testCases.length === 0) {
          toast.error(
            response.data.message ||
              "AI could not generate test cases from the input"
          );
        } else {
          setGeneratedCases(response.data.testCases);
          toast.success(
            `Generated ${response.data.testCases.length} test cases!`
          );
        }
      } else {
        toast.error("Failed to generate test cases");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error(error.message || "Failed to generate test cases");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
    if (generatedCases.length === 0) {
      toast.error("No test cases to import");
      return;
    }

    setIsImporting(true);

    try {
      // Call the bulk create API
      await onImport(generatedCases);
      toast.success(`Imported ${generatedCases.length} test cases successfully!`);

      // Reset state and close dialog
      setInputText("");
      setGeneratedCases([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Import Error:", error);
      toast.error("Failed to import test cases");
    } finally {
      setIsImporting(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index, field, value) => {
    const updatedCases = [...generatedCases];
    updatedCases[index][field] = value;
    setGeneratedCases(updatedCases);
  };

  const handleDelete = (index) => {
    const updatedCases = generatedCases.filter((_, i) => i !== index);
    setGeneratedCases(updatedCases);
    toast.success("Test case removed");
  };

  const handleClose = () => {
    setInputText("");
    setGeneratedCases([]);
    setEditingIndex(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate Test Cases with AI
          </DialogTitle>
          <DialogDescription>
            Describe your feature or test scenario, and AI will generate test
            cases for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.status !== "active"}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      {model.status === "coming_soon" && (
                        <Badge variant="outline" className="ml-2">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableModels.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {
                  availableModels.find((m) => m.id === selectedModel)
                    ?.description
                }
              </p>
            )}
          </div>

          {/* Input Text */}
          <div className="space-y-2">
            <Label htmlFor="inputText">Test Scenario Description</Label>
            <Textarea
              id="inputText"
              placeholder="Example: 1. goto products page and add an item from different chef, 2. try adding different item of the same chef"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Describe the test scenario steps or feature requirements
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Test Cases
              </>
            )}
          </Button>

          {/* Generated Test Cases */}
          {generatedCases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generated Test Cases ({generatedCases.length})</Label>
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready to import
                </Badge>
              </div>

              <Alert>
                <AlertDescription>
                  Review and edit the generated test cases below before
                  importing
                </AlertDescription>
              </Alert>

              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {generatedCases.map((testCase, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 space-y-2 bg-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        {editingIndex === index ? (
                          <>
                            <Input
                              value={testCase.title}
                              onChange={(e) =>
                                handleSaveEdit(index, "title", e.target.value)
                              }
                              className="font-medium"
                              placeholder="Test case title"
                            />
                            <Textarea
                              value={testCase.note}
                              onChange={(e) =>
                                handleSaveEdit(index, "note", e.target.value)
                              }
                              placeholder="Test steps"
                              rows={2}
                              className="text-sm"
                            />
                            <Textarea
                              value={testCase.expectedOutput}
                              onChange={(e) =>
                                handleSaveEdit(
                                  index,
                                  "expectedOutput",
                                  e.target.value
                                )
                              }
                              placeholder="Expected output"
                              rows={2}
                              className="text-sm"
                            />
                          </>
                        ) : (
                          <>
                            <h4 className="font-medium break-words">{testCase.title}</h4>
                            <p className="text-sm text-muted-foreground break-words">
                              <strong>Steps:</strong> {testCase.note}
                            </p>
                            <p className="text-sm text-muted-foreground break-words">
                              <strong>Expected:</strong>{" "}
                              {testCase.expectedOutput}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 self-end sm:self-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setEditingIndex(
                              editingIndex === index ? null : index
                            )
                          }
                          className="h-9 w-9 sm:h-8 sm:w-8"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="h-9 w-9 sm:h-8 sm:w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          {generatedCases.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting} className="w-full sm:w-auto">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>Import {generatedCases.length} Test Cases</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
