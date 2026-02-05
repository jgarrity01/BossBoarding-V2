// Main homepage
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle2, 
  ClipboardList, 
  Users, 
  Truck, 
  CreditCard,
  ArrowRight,
  Building2,
  WashingMachine,
  Shield,
  LogIn,
  Menu
} from 'lucide-react'

const features = [
  {
    icon: ClipboardList,
    title: 'Guided Onboarding',
    description: 'Step-by-step process that captures all required information for your Laundry Boss system.',
  },
  {
    icon: WashingMachine,
    title: 'Machine Inventory',
    description: 'Easily input all your washer and dryer details including pricing, models, and serial numbers.',
  },
  {
    icon: Users,
    title: 'Employee Setup',
    description: 'Add your staff with appropriate access levels - Admin, Attendant, or Employee.',
  },
  {
    icon: Truck,
    title: 'Shipping Coordination',
    description: 'Provide delivery details for your Laundry Boss system via LTL freight or UPS.',
  },
  {
    icon: CreditCard,
    title: 'Merchant Account',
    description: 'Seamless payment processing setup through our CardConnect partnership.',
  },
  {
    icon: Shield,
    title: 'PCI Compliance',
    description: 'Complete your PCI compliance consent and verification securely.',
  },
]

const steps = [
  { number: '01', title: 'Sign Contract', description: 'Sign your Laundry Boss service contract' },
  { number: '02', title: 'Kickoff Call', description: 'Review your order and discuss store details' },
  { number: '03', title: 'Complete Forms', description: 'Fill out your location and machine information' },
  { number: '04', title: 'Production', description: 'We produce and gather all system components' },
  { number: '05', title: 'Merchant Account', description: 'Complete your Card Connect merchant application' },
  { number: '06', title: 'Shipping', description: 'Your system ships to your chosen location' },
  { number: '07', title: 'Installation', description: 'Schedule installation based on your contract' },
  { number: '08', title: 'Go Live!', description: 'Training complete and system activated' },
]

// Simple header component (inline to avoid client component issues)
function SimpleHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center py-2">
          <Image
            src="/images/bossboarding-logo.png"
            alt="BossBoarding - Customer Onboarding Made Easy"
            width={180}
            height={70}
            className="object-contain"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-sm font-medium rounded-md bg-lb-blue text-white">Home</Link>
          <Link href="/onboarding" className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-lb-blue hover:bg-lb-cyan/10">Onboarding</Link>
          <Link href="/portal/login" className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-lb-blue hover:bg-lb-cyan/10">Customer Login</Link>
          <Link href="/admin" className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-lb-blue hover:bg-lb-cyan/10">Admin</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/onboarding">Start Onboarding</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
    </header>
  )
}

// Homepage component
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SimpleHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Background Image with Fade */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
            style={{ backgroundImage: "url('/images/welcome-aboard.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lb-cyan/15 via-lb-blue/5 to-transparent" />
          <div className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8">
                <Image
                  src="/images/laundryboss-logo-rtrademark.png"
                  alt="The Laundry Boss"
                  width={400}
                  height={120}
                  className="mx-auto object-contain"
                  priority
                />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lb-cyan/15 text-lb-blue text-sm font-medium mb-6 border border-lb-cyan/20">
                <Building2 className="h-4 w-4" />
                Welcome to the Laundry Boss Family
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
                Your Onboarding Journey Starts Here
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed text-pretty">
                Complete your Laundry Boss system setup with our guided onboarding process. 
                If you've received a unique onboarding link from your representative, use that to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="outline" className="text-base bg-transparent" asChild>
                  <Link href="/portal/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    Customer Login
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-base" asChild>
                  <Link href="/admin">Admin Portal</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need to Get Started
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive onboarding collects all the details required for a smooth installation and go-live.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border hover:border-lb-cyan/50 hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-lb-cyan/15 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-lb-blue" />
                    </div>
                    <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 md:py-28 bg-muted/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Laundry Boss Process
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From contract signing to going live - here is what to expect during your onboarding journey.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="bg-card rounded-xl p-6 border border-border h-full hover:border-lb-cyan/30 transition-colors">
                    <div className="text-4xl font-bold text-lb-cyan/30 mb-3">{step.number}</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-lb-cyan/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <CheckCircle2 className="h-8 w-8 text-lb-green" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Contact us to receive your personalized onboarding link and join the growing family of Laundry Boss powered laundromats.
              </p>
              <Button size="lg" className="text-base" asChild>
                <a href="mailto:onboarding@thelaundryboss.com">
                  Contact Us to Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 border-t border-border bg-lb-navy/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Need Help?</h3>
                <p className="text-muted-foreground">Contact our Onboarding Manager</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
                <a href="mailto:onboarding@thelaundryboss.com" className="text-lb-blue hover:text-lb-cyan font-medium transition-colors">
                  onboarding@thelaundryboss.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

  {/* Footer */}
  <footer className="border-t border-border py-8 bg-background">
  <div className="container mx-auto px-4">
  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
  <Image
    src="/images/bossboarding-logo.png"
    alt="BossBoarding - Customer Onboarding Made Easy"
    width={140}
    height={55}
    className="object-contain"
  />
  <p className="text-sm text-muted-foreground">
  &copy; {new Date().getFullYear()} Laundry Boss, LLC. All rights reserved.
  </p>
  </div>
  </div>
  </footer>
    </div>
  )
}
