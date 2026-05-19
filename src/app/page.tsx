import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Users, FileText, Shield, Clock } from "lucide-react";
import { authOptions } from "@/lib/auth/options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    const roleMap: Record<string, string> = {
      admin: "/admin",
      registrar: "/registrar",
      parent: "/parent",
    };
    const dest = roleMap[session.user.role];
    if (dest) redirect(dest);
  }
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-maroon text-white">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/images/ctk.png" alt="CTK Logo" width={40} height={40} className="h-10 w-10 rounded-full bg-white object-contain p-1" />
              <div>
                <span className="text-lg font-bold block leading-tight">CTK EnrollSys</span>
                <span className="text-gold text-xs">Christ the King Catholic School</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-gold hover:bg-maroon-light">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gold text-maroon-dark hover:bg-gold-light font-semibold">
                  Register
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-maroon via-maroon to-maroon-dark text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
              <Image src="/images/ctk.png" alt="CTK Logo" width={64} height={64} className="h-16 w-16 rounded-full bg-white object-contain p-1" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Christ the King Catholic School
            </h1>
            <p className="text-gold text-xl md:text-2xl font-semibold mb-2">
              Olongapo City
            </p>
            <div className="w-24 h-1 bg-gold mx-auto my-6"></div>
            <h2 className="text-2xl md:text-3xl font-medium mb-6">
              Enrollment & Records Management System
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              A modern digital platform for seamless enrollment. Submit applications online, 
              track status in real-time, and manage student records efficiently.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button size="lg" className="bg-gold text-maroon-dark hover:bg-gold-light font-semibold gap-2 h-12 px-8">
                  <Users className="h-5 w-5" />
                  Start Enrollment
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-maroon-dark font-semibold h-12 px-8">
                  Parent Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grade Levels */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {["Kinder 1", "Kinder 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((grade) => (
              <span key={grade} className="px-4 py-2 bg-white border-2 border-maroon/20 rounded-full text-maroon font-medium text-sm">
                {grade}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-maroon mb-12">
            Why Choose CTK EnrollSys?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl border-2 border-maroon/10 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-maroon" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-maroon">Online Enrollment</h3>
              <p className="text-gray-600">
                Submit enrollment applications from anywhere, anytime. No more long queues during enrollment period.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl border-2 border-maroon/10 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-maroon" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-maroon">Secure Documents</h3>
              <p className="text-gray-600">
                Upload and store documents securely in the cloud. Your data is protected and always accessible.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl border-2 border-maroon/10 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-maroon" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-maroon">Real-time Tracking</h3>
              <p className="text-gray-600">
                Track enrollment status in real-time. Receive instant notifications for every update.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-maroon/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-maroon mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Register", desc: "Create your parent account" },
              { step: 2, title: "Fill Form", desc: "Complete the enrollment form" },
              { step: 3, title: "Upload Docs", desc: "Submit required documents" },
              { step: 4, title: "Get Approved", desc: "Wait for confirmation" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center mx-auto mb-4 text-maroon-dark font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="font-bold text-maroon mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-maroon text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enroll?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join Christ the King Catholic School. Start your child&apos;s enrollment journey today.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gold text-maroon-dark hover:bg-gold-light font-semibold h-12 px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-maroon-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/images/ctk.png" alt="CTK Logo" width={40} height={40} className="h-10 w-10 rounded-full bg-white object-contain p-1" />
              <div>
                <p className="font-bold">Christ the King Catholic School</p>
                <p className="text-gold text-sm">Olongapo City</p>
              </div>
            </div>
            <div className="text-center md:text-right text-white/70 text-sm">
              <p>© {new Date().getFullYear()} CTK EnrollSys</p>
              <p>Enrollment and Records Management System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
