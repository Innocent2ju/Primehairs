"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import CodeSlots from "@/components/CodeSlots";

const RESEND_COOLDOWN_SECONDS = 30;

const inputClassName =
"w-full rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

type Step = "email" | "otp";

export function SignInForm() {
 const router = useRouter();
 const [step, setStep] = useState<Step>("email");
 const [email, setEmail] = useState("");
 const [otp, setOtp] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [isSending, setIsSending] = useState(false);
 const [isVerifying, setIsVerifying] = useState(false);
 const [isGoogleLoading, setIsGoogleLoading] = useState(false);
 const [cooldown, setCooldown] = useState(0);

useEffect(() => {
 if (cooldown <= 0) return;

 const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
 return () => clearTimeout(timer);
}, [cooldown]);

const normalizedEmail = email.trim();

async function handleGoogleSignIn() {
setError(null);
setIsGoogleLoading(true);

const { error } = await authClient.signIn.social({
 provider: "google",
 callbackURL: "/",
});

if (error) {
 setError(error.message ?? "Google sign-in failed. Please try again.");
 setIsGoogleLoading(false);
}
}

async function requestOtp(): Promise<boolean> {
setError(null);
setIsSending(true);

const { error } = await authClient.emailOtp.sendVerificationOtp({
 email: normalizedEmail,
 type: "sign-in",
});

setIsSending(false);

if (error) {
 setError(error.message ?? "We could not send your code. Please try again.");
 return false;
}

return true;
}

async function handleSend(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

if (!normalizedEmail) {
 setError("Enter your email address to continue.");
 return;
}

if (await requestOtp()) {
 setOtp("");
 setCooldown(RESEND_COOLDOWN_SECONDS);
 setStep("otp");
}
}

async function handleResend() {
if (cooldown > 0 || isSending) return;
if (await requestOtp()) setCooldown(RESEND_COOLDOWN_SECONDS);
}

async function handleVerify(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

if (otp.length !== 6) {
 setError("Enter the 6-digit code from your email.");
 return;
}

setError(null);
setIsVerifying(true);

const { error } = await authClient.signIn.emailOtp({
 email: normalizedEmail,
 otp,
});

setIsVerifying(false);

if (error) {
 setError(error.message ?? "That code is invalid or expired. Try again.");
 return;
}

router.replace("/");
router.refresh();
}

function handleChangeEmail() {
setStep("email");
setOtp("");
setError(null);
setCooldown(0);
}

return (
<div className="mt-8">
{error && (
<p
 role="alert"
 className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
>
{error}
</p>
)}

<button
 type="button"
 onClick={handleGoogleSignIn}
 disabled={isGoogleLoading}
 className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
>
<GoogleIcon />
{isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
</button>

<div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
<span className="h-px flex-1 bg-border" />
or
<span className="h-px flex-1 bg-border" />
</div>

{step === "email" ? (
<form onSubmit={handleSend} className="space-y-5">
<div className="space-y-2">
<label
 htmlFor="email"
 className="block text-sm font-medium text-foreground"
>
Email address
</label>
<input
 id="email"
 name="email"
 type="email"
 autoComplete="email"
 required
 autoFocus
 value={email}
 onChange={(event) => {
 setEmail(event.target.value);
 setError(null);
 }}
 placeholder="you@example.com"
 className={inputClassName}
/>
</div>

<button
 type="submit"
 disabled={isSending}
 className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
>
{isSending ? "Sending code..." : "Sign in/up"}
</button>
</form>
) : (
<form onSubmit={handleVerify} className="space-y-5">
<div className="space-y-2">
<h2 className="text-xl text-foreground">Check your email</h2>
<p className="text-sm leading-6 text-muted-foreground">
We sent a 6-digit code to{" "}
<span className="font-medium text-foreground">
{normalizedEmail}
</span>
.
</p>
</div>

<div className="space-y-2">
<p className="block text-sm font-medium text-foreground">
One-time code
</p>
<div className="flex justify-center">
<CodeSlots
 length={6}
 value={otp}
 onChange={(code) => {
 setOtp(code);
 if (code) setError(null);
 }}
 status={error ? "error" : "idle"}
 accentColor="#f5f5f5"
 inkColor="#f5f5f5"
 slotColor="#27272a"
 digitColor="#18181b"
 dangerColor="#ff3b30"
 slotSize={44}
 gap={8}
 radius={12}
 bounce={0.2}
 settle={0.3}
 rise={8}
 cascade={20}
 mask={false}
 caret
 autoFocus
 ariaLabel="One-time code"
 disabled={isVerifying}
/>
</div>
</div>

<button
 type="submit"
 disabled={isVerifying || otp.length !== 6}
 className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
>
{isVerifying ? "Verifying..." : "Verify and sign in"}
</button>

<div className="flex items-center justify-between gap-4 text-sm">
<button
 type="button"
 onClick={handleResend}
 disabled={cooldown > 0 || isSending}
 className="text-muted-foreground transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
>
{isSending
 ? "Sending..."
 : cooldown > 0
 ? `Resend code in ${cooldown}s`
 : "Resend code"}
</button>
<button
 type="button"
 onClick={handleChangeEmail}
 className="text-muted-foreground underline-offset-4 transition-colors hover:text-gold hover:underline"
>
Use a different email
</button>
</div>
</form>
)}
</div>
);
}

function GoogleIcon() {
return (
<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
<path
 fill="#4285F4"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
/>
<path
 fill="#34A853"
 d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
/>
<path
 fill="#FBBC05"
 d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
/>
<path
 fill="#EA4335"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
/>
</svg>
);
}
