"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ImportContactsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{
    imported: number;
    skipped: number;
    duplicates: number;
    optedOut: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResults(data.results);
      toast.success(`Imported ${data.results.imported} contacts`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Import Contacts
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Upload a CSV file with phone numbers
            </p>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              CSV Format
            </CardTitle>
            <CardDescription>
              Your CSV should have these columns (column names are flexible):
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4 font-mono text-sm dark:bg-gray-800/50">
              <p className="text-gray-600 dark:text-gray-400">phone,firstName,lastName,email</p>
              <p className="text-gray-900 dark:text-white">+15551234567,John,Doe,john@example.com</p>
              <p className="text-gray-900 dark:text-white">5559876543,Jane,Smith,jane@example.com</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• <strong>phone</strong> is required (will be formatted automatically)</li>
              <li>• Column names like "phone_number", "mobile", "cell" also work</li>
              <li>• Duplicates and opted-out contacts will be skipped</li>
            </ul>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                file
                  ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/10"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div>
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-violet-500" />
                  <p className="mt-4 font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">CSV files only</p>
                </div>
              )}
            </div>

            {file && !results && (
              <Button
                className="mt-4 w-full"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Importing..." : "Import Contacts"}
              </Button>
            )}

            {isUploading && (
              <div className="mt-4">
                <Progress value={50} className="h-2" />
                <p className="mt-2 text-center text-sm text-gray-500">
                  Processing CSV...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
                  <p className="text-2xl font-bold text-green-600">{results.imported}</p>
                  <p className="text-sm text-green-700 dark:text-green-500">Imported</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-600">{results.duplicates}</p>
                  <p className="text-sm text-gray-500">Duplicates</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/10">
                  <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-500">Skipped</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
                  <p className="text-2xl font-bold text-red-600">{results.optedOut}</p>
                  <p className="text-sm text-red-700 dark:text-red-500">Opted Out</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => {
                  setFile(null);
                  setResults(null);
                }}>
                  Import More
                </Button>
                <Button asChild>
                  <Link href="/contacts">View Contacts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
