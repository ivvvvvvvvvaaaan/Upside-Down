'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Monitor, Cloud, Github, Globe, RefreshCw } from 'lucide-react'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-surface-flat">
      <div className="max-w-4xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-body-1-regular text-foreground-subtle hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-heading-4 text-foreground mb-2">How It All Works</h1>
          <p className="text-body-1-regular text-foreground-dim">
            A visual guide to GitHub, Vercel, and publishing your prototypes.
          </p>
        </div>

        {/* Section 1: The Big Picture */}
        <section className="mb-12">
          <h2 className="text-heading-2 text-foreground mb-4">The Big Picture</h2>
          <div className="rounded border border-border-dim bg-surface-low p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Monitor className="w-8 h-8 text-blue-500" />
                </div>
                <span className="text-body-1-bold text-foreground">Your Computer</span>
                <span className="text-label-1-regular text-foreground-dim">Where you edit code</span>
              </div>

              <ArrowRight className="w-6 h-6 text-foreground-dim hidden md:block" />
              <div className="text-foreground-dim md:hidden">↓</div>

              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <Github className="w-8 h-8 text-foreground" />
                </div>
                <span className="text-body-1-bold text-foreground">GitHub</span>
                <span className="text-label-1-regular text-foreground-dim">Stores your code online</span>
              </div>

              <ArrowRight className="w-6 h-6 text-foreground-dim hidden md:block" />
              <div className="text-foreground-dim md:hidden">↓</div>

              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Cloud className="w-8 h-8 text-indigo-500" />
                </div>
                <span className="text-body-1-bold text-foreground">Vercel</span>
                <span className="text-label-1-regular text-foreground-dim">Turns code into website</span>
              </div>

              <ArrowRight className="w-6 h-6 text-foreground-dim hidden md:block" />
              <div className="text-foreground-dim md:hidden">↓</div>

              <div className="flex flex-col items-center gap-2 p-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-green-500" />
                </div>
                <span className="text-body-1-bold text-foreground">Live Website</span>
                <span className="text-label-1-regular text-foreground-dim">Anyone can visit</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: What is GitHub? */}
        <section className="mb-12">
          <h2 className="text-heading-2 text-foreground mb-4">What is GitHub?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <h3 className="text-body-1-bold text-foreground mb-3">Think of it like...</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">📁</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">Google Drive for code</p>
                    <p className="text-label-1-regular text-foreground-dim">Your files are saved online, not just on your computer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">⏱️</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">Time machine for your project</p>
                    <p className="text-label-1-regular text-foreground-dim">Every save is recorded, you can go back anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">🔒</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">Backup that never fails</p>
                    <p className="text-label-1-regular text-foreground-dim">Computer crashes? Your code is safe online</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <h3 className="text-body-1-bold text-foreground mb-3">Key terms</h3>
              <div className="space-y-3">
                <div className="p-3 rounded bg-surface-mid">
                  <p className="text-body-0-bold text-foreground">Repository (repo)</p>
                  <p className="text-label-1-regular text-foreground-dim">A folder for your project on GitHub</p>
                </div>
                <div className="p-3 rounded bg-surface-mid">
                  <p className="text-body-0-bold text-foreground">Commit</p>
                  <p className="text-label-1-regular text-foreground-dim">Saving a snapshot of your changes</p>
                </div>
                <div className="p-3 rounded bg-surface-mid">
                  <p className="text-body-0-bold text-foreground">Push</p>
                  <p className="text-label-1-regular text-foreground-dim">Uploading your commits to GitHub</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: What is Vercel? */}
        <section className="mb-12">
          <h2 className="text-heading-2 text-foreground mb-4">What is Vercel?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <h3 className="text-body-1-bold text-foreground mb-3">Think of it like...</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">🏭</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">A factory for websites</p>
                    <p className="text-label-1-regular text-foreground-dim">Takes your code, builds a real website from it</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">🌐</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">Hosting included</p>
                    <p className="text-label-1-regular text-foreground-dim">Your site lives on their servers, always online</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-heading-3">🔗</span>
                  <div>
                    <p className="text-body-1-regular text-foreground">Free URL</p>
                    <p className="text-label-1-regular text-foreground-dim">Get a link like yourproject.vercel.app</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <h3 className="text-body-1-bold text-foreground mb-3">The magic</h3>
              <div className="p-4 rounded bg-surface-mid">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw className="w-5 h-5 text-green-500" />
                  <p className="text-body-1-bold text-foreground">Auto-deploy</p>
                </div>
                <p className="text-body-1-regular text-foreground-dim mb-3">
                  When you push to GitHub, Vercel automatically:
                </p>
                <ol className="space-y-2 text-body-1-regular text-foreground-dim">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 text-label-0-bold flex items-center justify-center">1</span>
                    Detects the change
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 text-label-0-bold flex items-center justify-center">2</span>
                    Builds your site
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 text-label-0-bold flex items-center justify-center">3</span>
                    Publishes in ~1 minute
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: The Workflow */}
        <section className="mb-12">
          <h2 className="text-heading-2 text-foreground mb-4">Your Workflow</h2>
          <div className="rounded border border-border-dim bg-surface-low p-6">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-body-1-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-body-1-bold text-foreground">Edit on your computer</p>
                  <p className="text-body-1-regular text-foreground-dim">Make changes, see them instantly at localhost:3000</p>
                  <div className="mt-2 p-2 rounded bg-surface-mid font-mono text-label-1-regular text-foreground-dim">
                    npm run wizard → Start dev server
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-0.5 h-6 bg-border-dim"></div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center text-body-1-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-body-1-bold text-foreground">Save to GitHub</p>
                  <p className="text-body-1-regular text-foreground-dim">The wizard commits and pushes your changes</p>
                  <div className="mt-2 p-2 rounded bg-surface-mid font-mono text-label-1-regular text-foreground-dim">
                    npm run wizard → Deploy/Save changes
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-0.5 h-6 bg-border-dim"></div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-body-1-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-body-1-bold text-foreground">Live automatically</p>
                  <p className="text-body-1-regular text-foreground-dim">Vercel sees the push and deploys your site</p>
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20 text-label-1-regular text-green-600 dark:text-green-400">
                    ✓ yourproject.vercel.app is updated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: One-Time Setup */}
        <section className="mb-12">
          <h2 className="text-heading-2 text-foreground mb-4">One-Time Setup</h2>
          <p className="text-body-1-regular text-foreground-dim mb-4">
            You only need to do this once, then everything works automatically.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <div className="flex items-center gap-3 mb-4">
                <Github className="w-6 h-6 text-foreground" />
                <h3 className="text-body-1-bold text-foreground">GitHub Setup</h3>
              </div>
              <ol className="space-y-3 text-body-1-regular text-foreground-dim">
                <li>1. Create account at <a href="https://github.com" className="text-foreground-system-link underline">github.com</a></li>
                <li>2. Create a new repository</li>
                <li>3. Push this project to it</li>
              </ol>
            </div>
            <div className="rounded border border-border-dim bg-surface-low p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="w-6 h-6 text-indigo-500" />
                <h3 className="text-body-1-bold text-foreground">Vercel Setup</h3>
              </div>
              <ol className="space-y-3 text-body-1-regular text-foreground-dim">
                <li>1. Sign up at <a href="https://vercel.com" className="text-foreground-system-link underline">vercel.com</a> with GitHub</li>
                <li>2. Click "Add New Project"</li>
                <li>3. Import your repo → Deploy</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border-dim">
          <p className="text-body-1-regular text-foreground-dim mb-4">
            That's it! Once set up, just use the wizard to publish.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-500 text-white text-body-1-bold hover:bg-indigo-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
