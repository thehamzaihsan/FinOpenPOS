"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // In a pure local SQLite app, password reset is usually handled by the admin
      // For now, let's just simulate the request or point to a local reset path
      console.log("Local SQLite: Password reset requested for", email);
      
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1000));
      
      setSubmitted(true);
    } catch (err: any) {
      setError("Failed to process request. Please contact system administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-aeonik">
      <Card className="border-none shadow-xl max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Forgot Password?</CardTitle>
          <CardDescription>
            {submitted 
              ? "Check your system logs or contact admin" 
              : "Enter your email to receive reset instructions"}
          </CardDescription>
        </CardHeader>
        
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="email" 
                    placeholder="admin@local.finopenpos"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Send Instructions
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/auth/login")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="text-center py-8 space-y-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Request Received</h3>
              <p className="text-gray-600">
                In this local SQLite version, please contact your IT administrator 
                or check the backend logs to manually reset your password.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/login")}
            >
              Back to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
