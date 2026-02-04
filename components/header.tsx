'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Onboarding', href: '/onboarding' },
  { name: 'Customer Login', href: '/portal/login' },
  { name: 'Admin', href: '/admin' },
]

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              prefetch={item.href === '/admin' ? false : true}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
                  ? 'bg-lb-blue text-white'
                  : 'text-muted-foreground hover:text-lb-blue hover:bg-lb-cyan/10'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/onboarding">Start Onboarding</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <nav className="flex flex-col gap-2 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'px-4 py-3 text-base font-medium rounded-lg transition-colors',
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
                      ? 'bg-lb-blue text-white'
                      : 'text-muted-foreground hover:text-lb-blue hover:bg-lb-cyan/10'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                <Button className="w-full" asChild>
                  <Link href="/onboarding" onClick={() => setOpen(false)}>
                    Start Onboarding
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
