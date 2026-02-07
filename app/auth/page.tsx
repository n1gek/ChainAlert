"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "firebase/auth";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  User, 
  CheckCircle, 
  AlertCircle,
  Shield,
  ArrowRight,
  Smartphone,
  Chrome,
  Key
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formValid, setFormValid] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/home");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Validate form
  useEffect(() => {
    if (activeTab === "login") {
      setFormValid(email.includes("@") && password.length >= 6);
    } else if (activeTab === "signup") {
      const isEmailValid = email.includes("@");
      const isPasswordValid = password.length >= 8 && passwordStrength >= 3;
      const isPasswordMatch = password === confirmPassword;
      setFormValid(isEmailValid && isPasswordValid && isPasswordMatch);
    } else if (activeTab === "reset") {
      setFormValid(email.includes("@"));
    }
  }, [email, password, confirmPassword, passwordStrength, activeTab]);

  // Check password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [password]);

   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     setError("");
     setSuccess("");

     try {
       await signInWithEmailAndPassword(auth, email, password);
       setSuccess("Login successful! Redirecting...");
       // Auth state listener will handle redirect
     } catch (err: any) {
       let errorMessage = "Login failed. Please check your credentials.";
      
       switch (err.code) {
         case "auth/user-not-found":
           errorMessage = "No account found with this email.";
           break;
         case "auth/wrong-password":
           errorMessage = "Incorrect password.";
           break;
         case "auth/too-many-requests":
           errorMessage = "Too many attempts. Try again later or reset your password.";
           break;
         case "auth/invalid-email":
           errorMessage = "Invalid email address.";
           break;
       }
      
       setError(errorMessage);
     } finally {
       setIsLoading(false);
     }
   };

   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     setError("");
     setSuccess("");

     // Password verification check
     if (password !== confirmPassword) {
       setError("Passwords do not match");
       setIsLoading(false);
       return;
     }

     try {
       await createUserWithEmailAndPassword(auth, email, password);
       setSuccess("Account created successfully! Redirecting...");
       // Auth state listener will handle redirect
     } catch (err: any) {
       let errorMessage = "Signup failed. Please try again.";
      
       switch (err.code) {
         case "auth/email-already-in-use":
           errorMessage = "An account already exists with this email.";
           break;
         case "auth/weak-password":
           errorMessage = "Password is too weak. Please use a stronger password.";
           break;
         case "auth/invalid-email":
           errorMessage = "Invalid email address.";
           break;
         case "auth/operation-not-allowed":
           errorMessage = "Email/password accounts are not enabled. Please contact support.";
           break;
       }
      
       setError(errorMessage);
     } finally {
       setIsLoading(false);
     }
   };

   const handleGoogleSignIn = async () => {
     try {
       const provider = new GoogleAuthProvider();
       provider.setCustomParameters({
         prompt: 'select_account'
       });
       await signInWithPopup(auth, provider);
     } catch (err: any) {
       setError("Google sign in failed. Please try again.");
     }
   };

   const handlePasswordReset = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     setError("");
     setSuccess("");

     try {
       await sendPasswordResetEmail(auth, email);
       setSuccess("Password reset email sent! Check your inbox.");
       setTimeout(() => {
         setActiveTab("login");
         setSuccess("");
       }, 3000);
     } catch (err: any) {
       setError("Failed to send reset email. Please check your email address.");
     } finally {
       setIsLoading(false);
     }
   };

   const getStrengthColor = (strength: number) => {
     if (strength === 0) return "bg-gray-200";
     if (strength === 1) return "bg-red-500";
     if (strength === 2) return "bg-orange-500";
     if (strength === 3) return "bg-yellow-500";
     return "bg-green-500";
   };

   return (
     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center p-4">
       {/* Header */}
       <div className="text-center mb-8">
         <div className="flex items-center justify-center mb-4">
           <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-3">
             <Shield className="w-7 h-7 text-red-600" />
           </div>
           <h1 className="text-3xl font-bold text-gray-900">
             Chain<span className="text-red-600">Alert</span>
           </h1>
         </div>
         <p className="text-gray-600 max-w-md">
           Secure your safety with automatic check-ins and emergency escalation
         </p>
       </div>

       {/* Auth Card */}
       <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
         {/* Tabs */}
         <div className="flex border-b border-gray-200">
           <button
             onClick={() => setActiveTab("login")}
             className={`flex-1 py-4 text-center font-medium transition-colors ${
               activeTab === "login"
                 ? "text-blue-600 border-b-2 border-blue-600"
                 : "text-gray-500 hover:text-gray-700"
             }`}
           >
             Sign In
           </button>
           <button
             onClick={() => setActiveTab("signup")}
             className={`flex-1 py-4 text-center font-medium transition-colors ${
               activeTab === "signup"
                 ? "text-blue-600 border-b-2 border-blue-600"
                 : "text-gray-500 hover:text-gray-700"
             }`}
           >
             Sign Up
           </button>
         </div>

         {/* Forms */}
         <div className="p-8">
           {/* Error/Success Messages */}
           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
               <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
               <div className="text-sm text-red-700">{error}</div>
             </div>
           )}
          
           {success && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
               <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
               <div className="text-sm text-green-700">{success}</div>
             </div>
           )}

           {/* Login Form */}
           {activeTab === "login" && (
             <form onSubmit={handleLogin}>
               <div className="space-y-4 text-gray-700">
                 <div>
                   <label className="block text-sm font-medium mb-2">
                     Email Address
                   </label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-700"
                       required
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2">
                     Password
                   </label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-700"
                       required
                       minLength={6}
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                   </div>
                 </div>

                 <div className="flex justify-between items-center">
                   <button
                     type="button"
                     onClick={() => setActiveTab("reset")}
                     className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                   >
                     Forgot password?
                   </button>
                 </div>

                 <button
                   type="submit"
                   disabled={!formValid || isLoading}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                 >
                   {isLoading ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <>
                       Sign In
                       <ArrowRight className="w-5 h-5 ml-2" />
                     </>
                   )}
                 </button>

                 <div className="relative my-6">
                   <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-300"></div>
                   </div>
                   <div className="relative flex justify-center text-sm">
                     <span className="px-2 bg-white text-gray-500">Or continue with</span>
                   </div>
                 </div>

                 <button
                   type="button"
                   onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                 >
                   <Chrome className="w-5 h-5 mr-3" />
                   Sign in with Google
                 </button>
               </div>
             </form>
           )}

           {/* Signup Form */}
           {activeTab === "signup" && (
             <form onSubmit={handleSignup}>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Email Address
                   </label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-700"
                       required
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Password
                   </label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-700"
                       required
                       minLength={8}
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                   </div>
                  
                   {/* Password Strength */}
                   <div className="mt-2">
                     <div className="flex justify-between text-xs text-gray-600 mb-1">
                       <span>Password strength:</span>
                       <span>
                         {passwordStrength === 0 && "None"}
                         {passwordStrength === 1 && "Weak"}
                         {passwordStrength === 2 && "Fair"}
                         {passwordStrength === 3 && "Good"}
                         {passwordStrength === 4 && "Strong"}
                       </span>
                     </div>
                     <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                         style={{ width: `${passwordStrength * 25}%` }}
                       ></div>
                     </div>
                     <ul className="mt-2 text-xs text-gray-500 space-y-1">
                       <li className="flex items-center">
                         <CheckCircle className={`w-3 h-3 mr-2 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
                         At least 8 characters
                       </li>
                       <li className="flex items-center">
                         <CheckCircle className={`w-3 h-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                         One uppercase letter
                       </li>
                       <li className="flex items-center">
                         <CheckCircle className={`w-3 h-3 mr-2 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                         One number
                       </li>
                       <li className="flex items-center">
                         <CheckCircle className={`w-3 h-3 mr-2 {/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                         One special character
                       </li>
                     </ul>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Confirm Password
                   </label>
                   <div className="relative">
                     <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type={showConfirmPassword ? "text" : "password"}
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       placeholder="Confirm your password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-700 ${
                         confirmPassword && password !== confirmPassword 
                           ? "border-red-300" 
                           : "border-gray-300"
                       }`}
                       required
                     />
                     <button
                       type="button"
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                       {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                   </div>
                   {confirmPassword && password !== confirmPassword && (
                     <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                   )}
                 </div>

                 <div className="mt-6">
                   <button
                     type="submit"
                     disabled={!formValid || isLoading}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                   >
                     {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                       <>
                         Create Account
                         <ArrowRight className="w-5 h-5 ml-2" />
                       </>
                     )}
                   </button>
                 </div>

                 <p className="text-xs text-gray-500 mt-4 text-center">
                   By signing up, you agree to our Terms of Service and Privacy Policy
                 </p>
               </div>
             </form>
           )}

           {/* Reset Password Form */}
           {activeTab === "reset" && (
             <form onSubmit={handlePasswordReset}>
               <div className="space-y-6">
                 <div className="text-center mb-4">
                   <Key className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                   <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                   <p className="text-gray-600 text-sm mt-1">
                     Enter your email and we'll send you a link to reset your password
                   </p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Email Address
                   </label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <input
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com"
                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                       required
                     />
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={!formValid || isLoading}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                 >
                   {isLoading ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     "Send Reset Link"
                   )}
                 </button>

                 <button
                   type="button"
                   onClick={() => setActiveTab("login")}
                   className="w-full text-blue-600 hover:text-blue-800 font-medium text-sm"
                 >
                   ← Back to Sign In
                 </button>
               </div>
             </form>
           )}
         </div>
       </div>

       {/* Footer */}
       <div className="mt-8 text-center text-sm text-gray-500">
         <p>
           Need help?{" "}
           <a href="mailto:support@chainalert.com" className="text-blue-600 hover:underline">
             Contact Support
           </a>
         </p>
         <p className="mt-1">Your safety is our priority</p>
       </div>
     </div>
   );
 }
