import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Loader2, Check, AlertCircle, Video, Image as ImageIcon, Wand2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { useAuth } from '@/context/useAuth';

type JobStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface CreditBalance {
  allowed: boolean;
  balance: number;
  limit: number;
  usage: number;
}

const statusSteps = [
  { key: 'downloading', label: 'Downloading video', icon: Video },
  { key: 'transcribing', label: 'Transcribing audio', icon: Wand2 },
  { key: 'designing', label: 'Designing slides', icon: ImageIcon },
  { key: 'complete', label: 'Ready to download', icon: Check },
];

export default function CarouselGeneratorPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Fetch credit balance
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoadingCredits(true);
        const response = await client.get(endpoints.carousel.credits);
        setCredits(response.data.data);
      } catch (err: any) {
        console.error('Failed to load credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();
  }, []);

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await client.get(endpoints.carousel.status(jobId));
        const data = response.data.data;

        if (data.status === 'completed') {
          setJobStatus('completed');
          setCurrentStep(3);
        } else if (data.status === 'failed') {
          setJobStatus('failed');
          setError(data.error || 'Generation failed. Please try again.');
        } else {
          // Increment step for visual feedback
          setCurrentStep((prev) => Math.min(prev + 0.5, 2.5));
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, jobStatus]);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setError(null);
    setJobStatus('uploading');
    setCurrentStep(0);

    try {
      const response = await client.post(endpoints.carousel.generate, {
        url: url.trim(),
        slideCount,
      });

      const { jobId: newJobId, remainingCredits } = response.data.data;
      setJobId(newJobId);
      setJobStatus('processing');
      setCurrentStep(1);

      // Update credits
      if (credits) {
        setCredits({ ...credits, balance: remainingCredits, usage: credits.usage + 1 });
      }
    } catch (err: any) {
      setJobStatus('failed');
      setError(err.response?.data?.message || 'Failed to start generation. Please try again.');
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!jobId) return;
    try {
      setDownloading(true);
      const response = await client.get(endpoints.carousel.download(jobId), {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carousel-${jobId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      setError('Failed to download file. Please check your connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setJobStatus('idle');
    setJobId(null);
    setCurrentStep(0);
    setError(null);
    setUrl('');
  };

  const canGenerate = credits && credits.balance > 0 && url.trim().length > 0 && jobStatus === 'idle';

  return (
    <div className='p-4 sm:p-6 space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-8 w-8 text-primary' />
          <h1 className='text-3xl font-bold tracking-tight'>Visual Carousel Generator</h1>
        </div>
        <p className='text-muted-foreground'>Transform your videos into stunning, branded social media carousels in minutes</p>
      </div>

      {/* Credits Display */}
      <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-background'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Sparkles className='h-5 w-5' />
            Available Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCredits ? (
            <div className='flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm text-muted-foreground'>Loading...</span>
            </div>
          ) : credits ? (
            <div className='space-y-3'>
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold'>{credits.balance}</span>
                <span className='text-muted-foreground'>/ {credits.limit} this month</span>
              </div>
              <Progress value={(credits.usage / credits.limit) * 100} className='h-2' />
              <p className='text-xs text-muted-foreground'>
                You've used {credits.usage} of {credits.limit} credits this billing period
              </p>
              {credits.balance === 0 && (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>No credits remaining</AlertTitle>
                  <AlertDescription>
                    Upgrade your plan to get more credits.{' '}
                    <a href='/dashboard/billing' className='underline'>
                      View plans
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className='text-destructive'>Failed to load credits</p>
          )}
        </CardContent>
      </Card>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Your Carousel</CardTitle>
          <CardDescription>Paste a YouTube or TikTok URL and we'll generate a professional carousel with your branding</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {(jobStatus === 'idle' || jobStatus === 'uploading') && (
            <>
              {/* URL Input */}
              <div className='space-y-2'>
                <Label htmlFor='video-url'>Video URL</Label>
                <Input
                  id='video-url'
                  type='url'
                  placeholder='https://www.youtube.com/watch?v=...'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={jobStatus !== 'idle'}
                />
                <p className='text-xs text-muted-foreground'>Supported: YouTube, YouTube Shorts, TikTok</p>
              </div>

              {/* Slide Count Slider */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label>Number of Slides</Label>
                  <Badge variant='outline' className='font-mono'>
                    {slideCount}
                  </Badge>
                </div>
                <Slider
                  value={[slideCount]}
                  onValueChange={([value]) => setSlideCount(value)}
                  min={1}
                  max={7}
                  step={1}
                  className='w-full'
                  disabled={jobStatus !== 'idle'}
                />
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>1 slide</span>
                  <span>7 slides</span>
                </div>
              </div>

              {/* Branding Preview */}
              <Alert>
                <Info className='h-4 w-4' />
                <AlertTitle>Auto-Branding</AlertTitle>
                <AlertDescription>
                  Your carousel will be automatically branded with your profile image and handle: <strong>@{user?.username || 'username'}</strong>
                </AlertDescription>
              </Alert>

              {/* Error Display */}
              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              <Button onClick={handleGenerate} disabled={!canGenerate} className='w-full h-12 text-lg' size='lg'>
                {jobStatus === 'uploading' ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className='mr-2 h-5 w-5' />
                    Generate Carousel
                  </>
                )}
              </Button>
            </>
          )}

          {/* Processing State */}
          {jobStatus === 'processing' && (
            <div className='space-y-6 py-8'>
              <div className='text-center space-y-2'>
                <Loader2 className='h-12 w-12 animate-spin mx-auto text-primary' />
                <h3 className='text-xl font-semibold'>Creating your carousel...</h3>
                <p className='text-muted-foreground'>This usually takes 2-3 minutes. Feel free to navigate away.</p>
              </div>

              {/* Progress Steps */}
              <div className='space-y-4'>
                {statusSteps.map((step, index) => {
                  const isActive = index === Math.floor(currentStep);
                  const isComplete = index < Math.floor(currentStep);

                  return (
                    <div key={step.key} className='flex items-center gap-4'>
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isComplete
                            ? 'bg-primary text-primary-foreground'
                            : isActive
                            ? 'bg-primary/20 text-primary animate-pulse'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isComplete ? <Check className='h-5 w-5' /> : <step.icon className='h-5 w-5' />}
                      </div>
                      <div className='flex-1'>
                        <p className={`font-medium ${isActive || isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion State */}
          {jobStatus === 'completed' && (
            <div className='space-y-6 py-8 text-center'>
              <div className='mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
                <Check className='h-8 w-8 text-primary' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-2xl font-bold'>Your carousel is ready!</h3>
                <p className='text-muted-foreground'>Download your {slideCount}-slide branded carousel</p>
              </div>
              <div className='flex gap-3 justify-center'>
                <Button onClick={handleDownload} size='lg' className='gap-2' disabled={downloading}>
                  {downloading ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className='h-5 w-5' />
                      Download ZIP
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant='outline' size='lg' disabled={downloading}>
                  Create Another
                </Button>
              </div>
            </div>
          )}

          {/* Failed State */}
          {jobStatus === 'failed' && (
            <div className='space-y-6 py-8 text-center'>
              <div className='mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center'>
                <AlertCircle className='h-8 w-8 text-destructive' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-2xl font-bold'>Generation failed</h3>
                <p className='text-muted-foreground'>{error || 'Something went wrong. Please try again.'}</p>
              </div>
              <Button onClick={handleReset} variant='outline' size='lg'>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className='border-muted'>
        <CardHeader>
          <CardTitle className='text-base'>How it works</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm text-muted-foreground'>
          <div className='flex gap-3'>
            <div className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs'>
              1
            </div>
            <p>Paste your video URL and choose the number of slides (1-7)</p>
          </div>
          <div className='flex gap-3'>
            <div className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs'>
              2
            </div>
            <p>Our AI extracts key points and designs beautiful slides</p>
          </div>
          <div className='flex gap-3'>
            <div className='flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs'>
              3
            </div>
            <p>Download your branded carousel as a ZIP file with high-res images</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
