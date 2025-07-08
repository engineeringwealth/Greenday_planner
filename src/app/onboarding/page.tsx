
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OnboardingData, UserProfile } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { calculateHealthMetrics } from '@/lib/health-utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TOTAL_STEPS = 8;

const defaultFormData: OnboardingData = {
    goal: 'lose',
    name: '',
    activityLevel: 'lightly',
    gender: 'male',
    dob: '',
    units: 'metric',
    height: 170, // default cm
    currentWeight: 70, // default kg
    goalWeight: 65, // default kg
    intensity: 20, // default 20%
};

// Sub-components for each step
function StepIndicator({ step }: { step: number }) {
    return (
        <div className="w-full px-8">
            <p className="text-sm text-right text-muted-foreground mb-2">Step {step} of {TOTAL_STEPS}</p>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-2 bg-card" />
        </div>
    );
}

function OnboardingHeader() {
    return (
        <div className="w-full flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Myetician</h1>
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                Sign In
            </Link>
        </div>
    );
}

function Step1Goal({ data, setData }) {
    const options = [
        { value: 'lose', label: 'Lose Weight' },
        { value: 'maintain', label: 'Maintain Weight' },
        { value: 'gain', label: 'Gain Muscle' },
    ];
    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">What's your primary goal?</h2>
            <p className="text-muted-foreground mt-2">This helps us tailor your plan to what matters most to you.</p>
            <RadioGroup
                value={data.goal}
                onValueChange={(value) => setData({ ...data, goal: value })}
                className="mt-8 grid grid-cols-1 gap-4"
            >
                {options.map(opt => (
                    <Label key={opt.value} htmlFor={opt.value} className={cn(
                        "flex items-center justify-between w-full p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        data.goal === opt.value ? "border-primary bg-primary/10" : "border-card hover:border-primary/50"
                    )}>
                        <span className="font-semibold">{opt.label}</span>
                        <RadioGroupItem value={opt.value} id={opt.value} className="h-5 w-5" />
                    </Label>
                ))}
            </RadioGroup>
        </div>
    )
}

function Step2Name({ data, setData }) {
    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">What should we call you?</h2>
            <p className="text-muted-foreground mt-2">We'll use your name to personalize your experience.</p>
            <Input
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="Enter your name"
                className="mt-8 text-center text-lg h-12"
            />
        </div>
    );
}

function Step3Activity({ data, setData }) {
    const options = [
        { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
        { value: 'lightly', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
        { value: 'moderately', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
        { value: 'very', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
        { value: 'extremely', label: 'Extremely Active', desc: 'Very hard exercise & physical job' },
    ];
    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">Describe your activity level</h2>
            <p className="text-muted-foreground mt-2">This is crucial for estimating your daily calorie needs.</p>
            <RadioGroup
                value={data.activityLevel}
                onValueChange={(value) => setData({ ...data, activityLevel: value })}
                className="mt-8 grid grid-cols-1 gap-4 text-left"
            >
                {options.map(opt => (
                    <Label key={opt.value} htmlFor={opt.value} className={cn(
                        "flex items-center justify-between w-full p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        data.activityLevel === opt.value ? "border-primary bg-primary/10" : "border-card hover:border-primary/50"
                    )}>
                        <div>
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </div>
                        <RadioGroupItem value={opt.value} id={opt.value} className="h-5 w-5 ml-4" />
                    </Label>
                ))}
            </RadioGroup>
        </div>
    )
}

function Step4About({ data, setData }) {
    const handleDobChange = (part, value) => {
        const [year, month, day] = data.dob.split('-');
        let newDob;
        if (part === 'year') newDob = `${value}-${month || '01'}-${day || '01'}`;
        if (part === 'month') newDob = `${year || new Date().getFullYear()}-${value}-${day || '01'}`;
        if (part === 'day') newDob = `${year || new Date().getFullYear()}-${month || '01'}-${value}`;
        setData({ ...data, dob: newDob });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const [selectedYear, selectedMonth, selectedDay] = data.dob.split('-');

    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">Tell us about yourself</h2>
            <p className="text-muted-foreground mt-2">This information helps us make more accurate calculations for your goals.</p>
            <div className="mt-8 space-y-8 text-left">
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Gender</h3>
                    <RadioGroup
                        value={data.gender}
                        onValueChange={(value) => setData({ ...data, gender: value })}
                        className="grid grid-cols-2 gap-4"
                    >
                         <Label htmlFor="male" className={cn("flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors h-16", data.gender === 'male' ? "border-primary bg-primary/10" : "border-card hover:border-primary/50")}>
                            Male
                            <RadioGroupItem value="male" id="male" className="h-5 w-5 ml-4" />
                        </Label>
                        <Label htmlFor="female" className={cn("flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors h-16", data.gender === 'female' ? "border-primary bg-primary/10" : "border-card hover:border-primary/50")}>
                            Female
                            <RadioGroupItem value="female" id="female" className="h-5 w-5 ml-4" />
                        </Label>
                    </RadioGroup>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Date of Birth</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <Select value={selectedYear} onValueChange={(val) => handleDobChange('year', val)}>
                            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select value={selectedMonth} onValueChange={(val) => handleDobChange('month', val)}>
                            <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select value={selectedDay} onValueChange={(val) => handleDobChange('day', val)}>
                            <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                            <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Step5Measurements({ data, setData }) {
    const handleUnitChange = (newUnits: 'metric' | 'imperial') => {
        if (data.units === newUnits) return;
        const round = (num: number) => Math.round(num * 10) / 10;
        let { height, currentWeight, goalWeight } = data;

        if (newUnits === 'metric') { // from imperial to metric
            height = round(height * 2.54);
            currentWeight = round(currentWeight * 0.453592);
            goalWeight = round(goalWeight * 0.453592);
        } else { // from metric to imperial
            height = round(height / 2.54);
            currentWeight = round(currentWeight / 0.453592);
            goalWeight = round(goalWeight / 0.453592);
        }
        setData({ ...data, units: newUnits, height, currentWeight, goalWeight });
    }
    
    const isMetric = data.units === 'metric';

    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">Your Measurements</h2>
            <p className="text-muted-foreground mt-2">Use the sliders to provide your measurements.</p>
            
            <div className="text-right mt-4">
                <Select value={data.units} onValueChange={handleUnitChange}>
                    <SelectTrigger className="w-auto inline-flex h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="metric">kg / cm</SelectItem>
                        <SelectItem value="imperial">lbs / in</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-4 space-y-8 text-left">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Height</Label>
                        <span className="font-bold text-primary">{data.height.toFixed(isMetric ? 0 : 1)} {isMetric ? 'cm' : 'in'}</span>
                    </div>
                    <Slider 
                        value={[data.height]} 
                        onValueChange={([val]) => setData({...data, height: val})}
                        min={isMetric ? 120 : 48} 
                        max={isMetric ? 220 : 86} 
                        step={isMetric ? 1 : 0.5}
                    />
                </div>
                <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <Label>Current Weight</Label>
                        <span className="font-bold text-primary">{data.currentWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                    </div>
                    <Slider 
                        value={[data.currentWeight]} 
                        onValueChange={([val]) => setData({...data, currentWeight: val})}
                        min={isMetric ? 30 : 65} 
                        max={isMetric ? 180 : 400} 
                        step={0.1}
                    />
                </div>
                 <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <Label>Goal Weight</Label>
                        <span className="font-bold text-primary">{data.goalWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                    </div>
                    <Slider 
                        value={[data.goalWeight]} 
                        onValueChange={([val]) => setData({...data, goalWeight: val})}
                        min={isMetric ? 30 : 65} 
                        max={isMetric ? 180 : 400} 
                        step={0.1}
                    />
                </div>
            </div>
        </div>
    )
}

function Step6Intensity({ data, setData }) {
     return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">Personalize your plan</h2>
            <p className="text-muted-foreground mt-2">How aggressively do you want to pursue your goal? A higher percentage means faster results.</p>
             <div className="mt-8 space-y-2 text-left">
                <div className="flex justify-between items-center">
                    <Label>Intensity</Label>
                    <span className="font-bold text-primary">{data.intensity}%</span>
                </div>
                <Slider 
                    value={[data.intensity]} 
                    onValueChange={([val]) => setData({...data, intensity: val})}
                    min={10} 
                    max={30} 
                    step={1}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Slower</span>
                    <span>Faster</span>
                </div>
            </div>
        </div>
     )
}

function Step7Review({ data, onEdit }) {
    const healthMetrics = useMemo(() => calculateHealthMetrics(data), [data]);

    const formattedDob = useMemo(() => {
        if (!data.dob) return 'Not set';
        try {
            return new Date(data.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return data.dob;
        }
    }, [data.dob]);

    const items = [
        { label: "Name", value: data.name },
        { label: "Primary Goal", value: data.goal, transform: v => v.charAt(0).toUpperCase() + v.slice(1) },
        { label: "Activity Level", value: data.activityLevel, transform: v => v.charAt(0).toUpperCase() + v.slice(1) },
        { label: "Gender", value: data.gender, transform: v => v.charAt(0).toUpperCase() + v.slice(1) },
        { label: "Date of Birth", value: formattedDob },
        { label: "Height", value: `${data.height.toFixed(data.units === 'metric' ? 0 : 1)} ${data.units === 'metric' ? 'cm' : 'in'}` },
        { label: "Current Weight", value: `${data.currentWeight.toFixed(1)} ${data.units === 'metric' ? 'kg' : 'lbs'}` },
        { label: "Goal Weight", value: `${data.goalWeight.toFixed(1)} ${data.units === 'metric' ? 'kg' : 'lbs'}` },
        { label: "Intensity", value: `${data.intensity}%` },
    ];

    return (
        <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-bold">Review Your Information</h2>
            <p className="text-muted-foreground mt-2">Please confirm your details below. You can edit them before creating your account.</p>
            <Card className="mt-8 text-left p-6 bg-card">
                <CardContent className="p-0 space-y-3">
                    {items.map(item => (
                        <div key={item.label} className="flex justify-between items-center">
                            <p className="text-muted-foreground">{item.label}</p>
                            <p className="font-semibold">{item.transform ? item.transform(item.value) : item.value}</p>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                             <p className="text-muted-foreground">Est. Daily Calories</p>
                             <p className="font-bold text-lg text-primary">{healthMetrics.dailyCalorieGoal} kcal</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Button variant="link" onClick={onEdit} className="mt-4 text-primary">Edit Details</Button>
        </div>
    )
}

function Step8CreateAccount({ data, onAuth }) {
    const GoogleIcon = () => (
    <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.397 7.618C34.321 4.045 29.356 2 24 2 11.854 2 2 11.854 2 24s9.854 22 22 22c11.982 0 21.417-9.035 21.99-20.835l.021-.832z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.436-5.436C34.321 4.045 29.356 2 24 2 16.318 2 9.656 6.124 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 46c5.356 0 10.321-1.989 14.045-5.386l-6.522-5.33c-2.31 1.455-5.093 2.31-8.523 2.31-5.222 0-9.641-3.108-11.303-8H4.386C7.146 38.645 14.996 46 24 46z" />
      <path fill="#1976D2" d="M43.611 20.083H24v8h11.303a12.016 12.016 0 01-4.832 7.323l6.522 5.33C45.386 36.885 48 30.773 48 24c0-2.115-.183-4.164-.529-6.168L43.611 20.083z" />
    </svg>
  );

    return (
         <div className="w-full max-w-md text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl font-bold mt-4">You're all set, {data.name}!</h2>
            <p className="text-muted-foreground mt-2">One last step. Create an account to save your progress and access your personalized plan.</p>
            <div className="mt-8 space-y-4">
                <Button onClick={() => onAuth('google')} size="lg" className="w-full h-12 text-base">
                    <GoogleIcon />
                    Sign up with Google
                </Button>
                 <Button onClick={() => onAuth('email')} size="lg" variant="outline" className="w-full h-12 text-base">
                    <Mail className="mr-3 h-5 w-5"/>
                    Sign up with Email
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-6">By signing up, you agree to our Terms of Service.</p>
        </div>
    )
}

function EmailSignUpModal({ isOpen, onClose, onSignUp }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSignUp(email, password);
    }
    
    if (!isOpen) return null;
    
    return (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Sign up with Email</CardTitle>
                    <CardDescription>Create your account to save your plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input 
                            type="email" 
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                         />
                        <Input 
                            type="password" 
                            placeholder="Password (min. 6 characters)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                         />
                         <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Create Account</Button>
                         </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function OnboardingPage() {
    const { user, profileLoading, signUpWithEmail, signInWithGoogle } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingData>(defaultFormData);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    useEffect(() => {
        if (!profileLoading && user) {
            router.push('/');
        }
    }, [user, profileLoading, router]);

    const handleNext = () => {
        if (step < TOTAL_STEPS) {
            // Add validation logic here if needed
            if (step === 2 && !formData.name) {
                toast({ title: "Name is required", variant: "destructive"});
                return;
            }
             if (step === 4 && !formData.dob) {
                toast({ title: "Date of Birth is required", variant: "destructive"});
                return;
            }
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
    };

    const handleAuth = async (provider: 'google' | 'email', email?: string, password?: string) => {
        setIsSubmitting(true);
        try {
            const finalProfileData = { ...formData, ...calculateHealthMetrics(formData) };
            if (provider === 'google') {
                await signInWithGoogle(finalProfileData);
            } else if (email && password) {
                await signUpWithEmail(email, password, finalProfileData);
            }
            toast({ title: "Welcome!", description: "Your account has been created and your plan is ready." });
            // The auth context listener will handle the redirect to '/'
        } catch (error) {
            console.error("Onboarding auth failed:", error);
            // Error toast is handled by auth context
        } finally {
            setIsSubmitting(false);
            setIsEmailModalOpen(false);
        }
    }

    const openEmailModal = () => setIsEmailModalOpen(true);
    const handleEmailSignUp = (email, password) => handleAuth('email', email, password);

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Goal data={formData} setData={setFormData} />;
            case 2: return <Step2Name data={formData} setData={setFormData} />;
            case 3: return <Step3Activity data={formData} setData={setFormData} />;
            case 4: return <Step4About data={formData} setData={setFormData} />;
            case 5: return <Step5Measurements data={formData} setData={setFormData} />;
            case 6: return <Step6Intensity data={formData} setData={setFormData} />;
            case 7: return <Step7Review data={formData} onEdit={() => setStep(1)} />;
            case 8: return <Step8CreateAccount data={formData} onAuth={(provider) => provider === 'google' ? handleAuth('google') : openEmailModal() } />;
            default: return null;
        }
    };
    
    if (profileLoading || user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <main className="flex min-h-screen flex-col items-center justify-between bg-background p-4 sm:p-8">
            <header className="w-full max-w-md flex flex-col items-center space-y-4">
                <OnboardingHeader />
                <StepIndicator step={step} />
            </header>

            <div className="flex-grow flex items-center justify-center w-full py-8">
                {isSubmitting ? <Loader2 className="h-16 w-16 animate-spin text-primary" /> : renderStep()}
            </div>

            <footer className="w-full max-w-md flex items-center justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
                ) : <div />}
                {step < TOTAL_STEPS && (
                    <Button onClick={handleNext} disabled={isSubmitting}>
                        Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </footer>
            
            <EmailSignUpModal 
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSignUp={handleEmailSignUp}
            />
        </main>
    );
}

// Minimal Label component for internal use
const Label = ({ children, ...props }) => (
    <label {...props}>{children}</label>
);
